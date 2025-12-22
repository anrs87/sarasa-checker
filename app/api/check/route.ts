import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { tavily } from '@tavily/core';
import Groq from 'groq-sdk'; // <--- IMPORT NUEVO
import { NextResponse } from 'next/server';
import { normalizeUrl } from '@/lib/utils'; // Usamos la nueva función del utils

// 1. Configuración de Clientes
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! }); // <--- CLIENTE GROQ
const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY! });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const maxDuration = 60;

// Prompt Maestro reutilizable para ambas IAs
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
    "diplomatic_message": "Un mensaje amable para WhatsApp para desmentir la noticia sin pelear.",
    "sources": [{"title": "Nombre Fuente", "url": "URL"}]
  }
`;

export async function POST(req: Request) {
  try {
    const { urlOrText: userQuery } = await req.json();

    if (!userQuery) {
      return NextResponse.json({ error: 'Falta el texto, che.' }, { status: 400 });
    }

    // --- PASO 1: CACHE (Búsqueda inteligente) ---
    const normalizedQuery = normalizeUrl(userQuery);
    console.log(`🔍 Buscando en caché: ${normalizedQuery}`);

    const { data: cachedData, error: dbError } = await supabase
      .from('checks')
      .select('*')
      .ilike('original_text_url', `%${normalizedQuery}%`) // Buscamos coincidencia parcial
      .limit(1)
      .single();

    if (cachedData && !dbError) {
      console.log('⚡ ¡Encontrado en Cache! Ahorrando cuota...');
      return NextResponse.json(cachedData.gemini_verdict);
    }

    // --- PASO 2: INVESTIGACIÓN (Tavily) ---
    console.log('🕵️ Investigando con Tavily...');
    const searchResult = await tvly.search(userQuery, {
      searchDepth: "advanced",
      maxResults: 5,
    });

    const context = searchResult.results.map((r: any) => `${r.title}: ${r.content}`).join('\n');
    const sources = searchResult.results.map((r: any) => ({ title: r.title, url: r.url }));

    // --- PASO 3: CEREBRO HÍBRIDO (Gemini -> Fallback Groq -> Fallback Solo Evidencia) ---
    let verificationResult = null;
    let aiModelUsed = 'gemini';

    // INTENTO A: GEMINI
    try {
      console.log('🧠 [Intento 1] Consultando a Gemini 1.5 Flash...');
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash", // Usamos Flash que es más rápido y barato
        generationConfig: { responseMimeType: "application/json" }
      });

      const prompt = `${SYSTEM_PROMPT}\nInput Usuario: "${userQuery}"\nFuentes: ${context}`;
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      verificationResult = JSON.parse(responseText);

    } catch (geminiError: any) {
      console.error('⚠️ Gemini falló (posible 429):', geminiError.message);

      // INTENTO B: GROQ (Si Gemini falla)
      try {
        console.log('🚀 [Intento 2] Activando Protocolo Groq (Llama 3)...');

        const chatCompletion = await groq.chat.completions.create({
          messages: [
            { role: "system", content: SYSTEM_PROMPT + " IMPORTANTE: Devuelve SOLO JSON." },
            { role: "user", content: `Input: "${userQuery}"\nFuentes: ${context}` }
          ],
          model: "llama3-70b-8192", // Modelo open source potentísimo
          temperature: 0.5,
          response_format: { type: "json_object" }, // Forzamos JSON
        });

        const content = chatCompletion.choices[0]?.message?.content || "{}";
        verificationResult = JSON.parse(content);
        aiModelUsed = 'groq-llama3';

      } catch (groqError: any) {
        console.error('❌ Groq también falló:', groqError.message);

        // INTENTO C: MODO "SOLO EVIDENCIA" (Si todo falla)
        console.log('🛡️ Activando Modo Respaldo (Solo Evidencia)');
        verificationResult = {
          verdict: "DUDOSO", // Gris neutro
          smoke_level: 50,
          title: "Investigalo vos (Las IAs duermen)",
          summary: "Encontramos estas fuentes, pero nuestras IAs están saturadas para leerlas ahora. Fijate los links abajo.",
          diplomatic_message: "Che, mirá estos links que encontré sobre el tema.",
          sources: sources
        };
        aiModelUsed = 'fallback-evidence';
      }
    }

    // --- PASO 4: GUARDAR EN SUPABASE ---
    // Guardamos SIEMPRE, incluso si fue Groq o Fallback, para no gastar de nuevo
    if (verificationResult) {
      console.log(`💾 Guardando en base de datos (Motor: ${aiModelUsed})...`);

      // Aseguramos que sources esté presente
      if (!verificationResult.sources || verificationResult.sources.length === 0) {
        verificationResult.sources = sources;
      }

      await supabase.from('checks').insert({
        original_text_url: normalizedQuery, // Guardamos la URL limpia
        gemini_verdict: verificationResult,
        smoke_level: verificationResult.smoke_level || 50,
        verdict: verificationResult.verdict,
        title: verificationResult.title
      });
    }

    return NextResponse.json(verificationResult);

  } catch (error: any) {
    console.error('💥 Error Crítico:', error.message);
    return NextResponse.json({ error: 'Explotó todo. Probá en un rato.' }, { status: 500 });
  }
}