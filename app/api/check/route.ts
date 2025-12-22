import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { tavily } from '@tavily/core';
import { NextResponse } from 'next/server';

// 1. Configuración de Clientes
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY! });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function normalizeUrl(url: string) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '') + urlObj.pathname.replace(/\/$/, '');
  } catch (e) {
    return url;
  }
}

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { urlOrText: userQuery } = await req.json();

    if (!userQuery) {
      return NextResponse.json({ error: 'Falta el texto, che.' }, { status: 400 });
    }

    // --- PASO 1: CACHE ---
    const normalizedQuery = normalizeUrl(userQuery);
    const { data: cachedData, error: dbError } = await supabase
      .from('checks')
      .select('*')
      .ilike('original_text_url', `%${normalizedQuery}%`)
      .limit(1)
      .single();

    if (cachedData && !dbError) {
      return NextResponse.json(cachedData.gemini_verdict);
    }

    // --- PASO 2: INVESTIGACIÓN ---
    console.log('🕵️ Investigando con Tavily...');
    const searchResult = await tvly.search(userQuery, {
      searchDepth: "advanced",
      maxResults: 5,
    });

    const context = searchResult.results.map((r: any) => `${r.title}: ${r.content}`).join('\n');

    // --- PASO 3: ANÁLISIS (USANDO 1.5 FLASH) ---
    console.log('🧠 Consultando a Gemini 1.5 Flash-latest...');

    // Usamos este modelo ESPECÍFICO que vimos en tu lista (image_ec522b.png)
    // Es 2.0 (que te funciona) y Lite (para que no salte el error de cuota)
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-lite-preview-02-05",
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `
      Actúa como "El Avivador", experto verificador argentino. 
      Personalidad: Directo, usas lunfardo sutil ("es humo", "la posta", "ojo al piojo").
      
      Tarea: Analiza la veracidad del siguiente texto/URL basándote en las fuentes encontradas.
      
      Input Usuario: "${userQuery}"
      Fuentes encontradas: 
      ${context}

      Responde UNICAMENTE en JSON:
      {
        "verdict": "VERDADERO" | "FALSO" | "DUDOSO" | "SATIRA",
        "smoke_level": 0-100,
        "title": "Título corto e irónico (máx 6 palabras)",
        "summary": "Explicación de 3 líneas máximo, hablándole al usuario de 'vos'.",
        "diplomatic_message": "Un mensaje amable para WhatsApp para desmentir la noticia sin pelear.",
        "sources": [{"title": "Fuente", "url": "..."}]
      }
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const verificationResult = JSON.parse(responseText);

    // --- PASO 4: GUARDAR EN SUPABASE ---
    await supabase.from('checks').insert({
      original_text_url: userQuery,
      gemini_verdict: verificationResult,
      smoke_level: verificationResult.smoke_level,
      verdict: verificationResult.verdict,
      title: verificationResult.title
    });

    return NextResponse.json(verificationResult);

  } catch (error: any) {
    console.error('💥 Error en el proceso:', error.message);

    // Manejo específico del error de cuota (429)
    if (error.message?.includes('429') || error.status === 429) {
      return NextResponse.json({
        verdict: "DUDOSO",
        title: "¡Google se quedó sin aire!",
        summary: "Estamos probando tanto que Google nos pidió un respiro. Aguantá un minutito y probá de nuevo.",
        smoke_level: 50,
        sources: [],
        diplomatic_message: "Che, el sistema está un poco saturado por las pruebas, en un ratito volvemos a chequear."
      }, { status: 429 });
    }

    return NextResponse.json({ error: 'Error interno procesando la solicitud' }, { status: 500 });
  }
}