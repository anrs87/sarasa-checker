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

const SYSTEM_PROMPT = `
  Actúa como "El Avivador", un verificador de hechos argentino experto, perspicaz y con calle.
  
  OBJETIVO: Analizar la veracidad del texto o link ingresado basándote estrictamente en las fuentes provistas.

  DIRECTRICES DE PERSONALIDAD:
  - Usá lunfardo sutil y natural ("es humo", "la posta", "ojo al piojo", "mandaron fruta").
  - NO seas agresivo, pero sí firme con la verdad.
  - IMPORTANTE: No narres la noticia como si le estuviera pasando al usuario. Si la noticia es sobre jubilados muertos, no digas "Vos apareces muerto". Di: "Hubo un error donde figuraban personas fallecidas".
  
  Estructura de respuesta JSON requerida (UNICAMENTE JSON):
  {
    "verdict": "VERDADERO" | "FALSO" | "DUDOSO" | "SATIRA",
    "smoke_level": 0-100 (número entero, donde 100 es mentira absoluta),
    "title": "Título corto, irónico y ganchero (máx 6 palabras). Que resuma la conclusión.",
    "summary": "Explicación del HECHO en 3 líneas máximo. Explicá qué pasó realmente. Usá 'vos' solo para dar consejos directos (ej: 'No compartas esto'). NO uses primera persona para describir el evento.",
    "diplomatic_message": "Texto listo para copiar y pegar en WhatsApp. Debe ser amable, neutral y conciliador para no generar peleas en el grupo familiar. Ej: 'Che, estuve viendo y parece que esto no es tan así...'",
    "sources": [{"title": "Nombre Fuente (Ej: Clarín, Chequeado, Boletín Oficial)", "url": "URL original"}]
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
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
        const prompt = "Actúa como un extractor OCR inteligente. Analiza esta imagen. Si ves una noticia, tuit o cadena de whatsapp, extrae SOLAMENTE la afirmación principal o el título y el cuerpo del texto. Ignora hora, batería o menús del celular. Dame el texto puro.";

        const mimeType = imageBase64.substring(imageBase64.indexOf(':') + 1, imageBase64.indexOf(';'));
        const base64Data = imageBase64.split(',')[1];

        const imagePart = {
          inlineData: {
            data: base64Data,
            mimeType: mimeType || "image/jpeg"
          }
        };

        const result = await model.generateContent([prompt, imagePart]);
        const extractedText = result.response.text();
        console.log(`👁️ Texto extraído: "${extractedText.substring(0, 50)}..."`);
        userQuery = extractedText;

      } catch (visionError: any) {
        console.error('⚠️ Falló la visión:', visionError.message);
        return NextResponse.json({ error: `La IA no pudo ver la imagen (Error: ${visionError.message}). Probá con texto.` }, { status: 500 });
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
      return NextResponse.json({ ...cachedData.gemini_verdict, id: cachedData.id });
    }

    // --- PASO 2: INVESTIGACIÓN (Tavily) ---
    console.log('🕵️ Investigando con Tavily...');

    const searchVal = userQuery.length > 300 ? userQuery.slice(0, 300) : userQuery;

    const searchResult = await tvly.search(searchVal, {
      searchDepth: "advanced",
      maxResults: 5,
    });

    const context = searchResult.results.map((r: any) => `${r.title}: ${r.content}`).join('\n');
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

    // --- PASO 4: GUARDADO CON DEBUG ---
    let savedId = null;

    if (verificationResult) {
      verificationResult.sources = realSources;

      console.log(`💾 Intentando guardar en Supabase (Motor: ${aiModelUsed})...`);

      const { data: insertedData, error: insertError } = await supabase.from('checks').insert({
        original_text_url: normalizedQuery,
        gemini_verdict: verificationResult,
        smoke_level: verificationResult.smoke_level || 50,
        verdict: verificationResult.verdict,
        title: verificationResult.title
      })
        .select('id')
        .single();

      // DEBUGGER DE SUPABASE: Si falla, esto sale en rojo en los logs
      if (insertError) {
        console.error("🔴 ERROR CRÍTICO SUPABASE:", JSON.stringify(insertError, null, 2));
      }

      if (insertedData) {
        console.log("✅ Guardado exitoso. ID:", insertedData.id);
        savedId = insertedData.id;
      }
    }

    return NextResponse.json({
      ...verificationResult,
      id: savedId
    });

  } catch (error: any) {
    console.error('💥 Error Crítico General:', error.message);
    return NextResponse.json({ error: 'Explotó todo. Probá en un rato.' }, { status: 500 });
  }
}