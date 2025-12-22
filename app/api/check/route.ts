import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { tavily } from '@tavily/core';
import Groq from 'groq-sdk';
import { NextResponse } from 'next/server';
import { normalizeUrl } from '@/lib/utils';

// 1. Configuración de Clientes
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });
const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY! });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const maxDuration = 60;

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

    // --- PASO 1: CACHE ---
    const normalizedQuery = normalizeUrl(userQuery);
    console.log(`🔍 Buscando en caché: ${normalizedQuery}`);

    const { data: cachedData, error: dbError } = await supabase
      .from('checks')
      .select('*')
      .ilike('original_text_url', `%${normalizedQuery}%`)
      .limit(1)
      .single();

    if (cachedData && !dbError) {
      console.log('⚡ ¡Encontrado en Cache!');
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

    // --- PASO 3: CEREBRO HÍBRIDO (GROQ TITULAR) ---
    let verificationResult = null;
    let aiModelUsed = 'groq';

    // INTENTO A: GROQ (Llama 3.3) - ¡AHORA ES EL PRIMERO!
    try {
      console.log('🚀 [Intento 1] Consultando a Groq (Llama 3.3)...');

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
      // aiModelUsed ya es 'groq'

    } catch (groqError: any) {
      console.error('❌ Groq falló:', groqError.message);

      // INTENTO B: GEMINI (Backup)
      try {
        console.log('🧠 [Intento 2] Activando Respaldo Gemini...');

        // Usamos el alias genérico que aparecía en tu lista, suele ser más permisivo
        const model = genAI.getGenerativeModel({
          model: "gemini-flash-latest",
          generationConfig: { responseMimeType: "application/json" }
        });

        const prompt = `${SYSTEM_PROMPT}\nInput Usuario: "${userQuery}"\nFuentes: ${context}`;
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        verificationResult = JSON.parse(responseText);
        aiModelUsed = 'gemini';

      } catch (geminiError: any) {
        console.error('⚠️ Gemini también falló:', geminiError.message);

        // INTENTO C: MODO EVIDENCIA
        console.log('🛡️ Activando Modo Solo Evidencia');
        verificationResult = {
          verdict: "DUDOSO",
          smoke_level: 50,
          title: "Investigalo vos (IAs saturadas)",
          summary: "Encontramos estas fuentes, pero nuestras IAs están descansando. Fijate los links.",
          diplomatic_message: "Che, mirá estos links que encontré sobre el tema.",
          sources: sources
        };
        aiModelUsed = 'fallback';
      }
    }

    // --- PASO 4: GUARDAR ---
    if (verificationResult) {
      if (!verificationResult.sources || verificationResult.sources.length === 0) {
        verificationResult.sources = sources;
      }

      console.log(`💾 Guardando (Motor: ${aiModelUsed})...`);
      await supabase.from('checks').insert({
        original_text_url: normalizedQuery,
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