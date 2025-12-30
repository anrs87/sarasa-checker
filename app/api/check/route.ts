import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { tavily } from '@tavily/core';
import Groq from 'groq-sdk';
import { NextResponse } from 'next/server';
import { normalizeUrl, extractSocialContent } from '@/lib/utils';

// Configuración de Clientes
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });
const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY! });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const maxDuration = 60;

// PROMPT ACTUALIZADO: Le prohibimos poner links en el mensaje diplomático
const SYSTEM_PROMPT = `
  Actúa como "El Avivador", experto verificador argentino. 
  Personalidad: Directo, usas lunfardo sutil ("es humo", "la posta", "ojo al piojo").
  
  Tarea: Analiza la veracidad del input basándote en las fuentes.
  
  Responde UNICAMENTE en JSON válido con esta estructura exacta:
  {
    "verdict": "VERDADERO" | "FALSO" | "DUDOSO" | "SATIRA",
    "smoke_level": 0-100 (número),
    "title": "Título corto e irónico (máx 6 palabras)",
    "summary": "Explicación de 3 líneas máximo, hablándole al usuario de 'vos'.",
    "diplomatic_message": "Un mensaje amable para WhatsApp para desmentir la noticia sin pelear. NO INCLUYAS LINKS NI FUENTES AQUÍ.",
    "sources": [{"title": "Nombre Fuente", "url": "URL"}]
  }
`;

export async function POST(req: Request) {
  try {
    let { urlOrText: userQuery, imageBase64 } = await req.json();

    if (!userQuery && !imageBase64) {
      return NextResponse.json({ error: 'Falta data, che (texto, link o foto).' }, { status: 400 });
    }

    // --- FASE 0: PRE-PROCESAMIENTO ---

    // CASO A: IMAGEN
    if (imageBase64) {
      console.log('👁️ Analizando imagen con Gemini Vision...');
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = "Actúa como un extractor OCR inteligente. Analiza esta imagen. Si ves una noticia, tuit o cadena de whatsapp, extrae SOLAMENTE la afirmación principal o el título y el cuerpo del texto. Ignora hora, batería o menús del celular. Dame el texto puro.";

        const imagePart = {
          inlineData: {
            data: imageBase64.split(',')[1],
            mimeType: "image/jpeg"
          }
        };

        const result = await model.generateContent([prompt, imagePart]);
        const extractedText = result.response.text();
        console.log(`👁️ Texto extraído: "${extractedText.substring(0, 50)}..."`);
        userQuery = extractedText;

      } catch (visionError) {
        console.error('⚠️ Falló la visión:', visionError);
        return NextResponse.json({ error: 'No pudimos leer la imagen. Probá escribir el texto.' }, { status: 500 });
      }
    }

    // CASO B: LINK SOCIAL
    else if (userQuery.includes('facebook.com') || userQuery.includes('instagram.com') || userQuery.includes('share')) {
      console.log('🕵️ Intentando desenrollar link social...');
      const socialContent = await extractSocialContent(userQuery);
      if (socialContent) {
        console.log('✅ Texto recuperado de redes.');
        userQuery = socialContent;
      }
    }

    // --- PASO 1: CACHE ---
    const normalizedQuery = normalizeUrl(userQuery);
    console.log(`🔍 Buscando en caché: ${normalizedQuery.substring(0, 50)}...`);

    const { data: cachedData, error: dbError } = await supabase
      .from('checks')
      .select('*')
      .ilike('original_text_url', `%${normalizedQuery.substring(0, 100)}%`)
      .limit(1)
      .single();

    if (cachedData && !dbError) {
      console.log('⚡ ¡Encontrado en Cache!');
      // Devolvemos también el ID para que funcione el permalink en resultados cacheados
      return NextResponse.json({ ...cachedData.gemini_verdict, id: cachedData.id });
    }

    // --- PASO 2: INVESTIGACIÓN (Tavily) ---
    console.log('🕵️ Investigando con Tavily...');
    const searchResult = await tvly.search(userQuery, {
      searchDepth: "advanced",
      maxResults: 5,
    });

    const context = searchResult.results.map((r: any) => `${r.title}: ${r.content}`).join('\n');
    // ESTAS SON LAS FUENTES REALES (LINKS COMPLETOS)
    const realSources = searchResult.results.map((r: any) => ({ title: r.title, url: r.url }));

    // --- PASO 3: CEREBRO HÍBRIDO ---
    let verificationResult = null;
    let aiModelUsed = 'groq';

    try {
      console.log('🚀 [Intento 1] Consultando a Groq...');
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: SYSTEM_PROMPT + " IMPORTANTE: Devuelve SOLO JSON." },
          { role: "user", content: `Input: "${userQuery}"\nFuentes: ${context}` }
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.5,
        response_format: { type: "json_object" },
      });
      const content = chatCompletion.choices[0]?.message?.content || "{}";
      verificationResult = JSON.parse(content);

    } catch (groqError: any) {
      console.error('❌ Groq falló:', groqError.message);
      try {
        console.log('🧠 [Intento 2] Activando Respaldo Gemini...');
        const model = genAI.getGenerativeModel({
          model: "gemini-flash-latest",
          generationConfig: { responseMimeType: "application/json" }
        });
        const prompt = `${SYSTEM_PROMPT}\nInput Usuario: "${userQuery}"\nFuentes: ${context}`;
        const result = await model.generateContent(prompt);
        verificationResult = JSON.parse(result.response.text());
        aiModelUsed = 'gemini';
      } catch (geminiError: any) {
        console.error('⚠️ Gemini también falló:', geminiError.message);
        verificationResult = {
          verdict: "DUDOSO",
          smoke_level: 50,
          title: "Investigalo vos (IAs saturadas)",
          summary: "Encontramos estas fuentes, pero nuestras IAs están descansando.",
          diplomatic_message: "Che, mirá estos links que encontré sobre el tema.",
          sources: realSources
        };
        aiModelUsed = 'fallback';
      }
    }

    // --- PASO 4: GUARDADO Y CURACIÓN DE FUENTES ---
    let savedId = null;

    if (verificationResult) {
      // 🚨 INYECCIÓN DE VERDAD: Pisamos las fuentes de la IA con las de Tavily
      verificationResult.sources = realSources;

      console.log(`💾 Guardando (Motor: ${aiModelUsed})...`);

      const { data: insertedData } = await supabase.from('checks').insert({
        original_text_url: normalizedQuery,
        gemini_verdict: verificationResult,
        smoke_level: verificationResult.smoke_level || 50,
        verdict: verificationResult.verdict,
        title: verificationResult.title
      })
        .select('id') // Pedimos el ID de vuelta
        .single();

      if (insertedData) {
        savedId = insertedData.id;
      }
    }

    // Devolvemos el resultado + el ID para compartir
    return NextResponse.json({
      ...verificationResult,
      id: savedId
    });

  } catch (error: any) {
    console.error('💥 Error Crítico:', error.message);
    return NextResponse.json({ error: 'Explotó todo. Probá en un rato.' }, { status: 500 });
  }
}