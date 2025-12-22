import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { tavily } from '@tavily/core';
import { NextResponse } from 'next/server';

// 1. Configuración de Clientes (Las llaves del reino)
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY! });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Función auxiliar para limpiar la URL (Normalización)
// Esto evita que "google.com" y "www.google.com" cuenten como dos chequeos distintos
function normalizeUrl(url: string) {
  try {
    const urlObj = new URL(url);
    // Quitamos 'www.' y la barra final para estandarizar
    return urlObj.hostname.replace('www.', '') + urlObj.pathname.replace(/\/$/, '');
  } catch (e) {
    return url; // Si es texto plano, lo devolvemos tal cual
  }
}

export const maxDuration = 60; // Damos tiempo a Tavily y Gemini (Serverless limit)

export async function POST(req: Request) {
  try {
    const { url: userQuery } = await req.json();

    if (!userQuery) {
      return NextResponse.json({ error: 'Falta la URL o el texto, che.' }, { status: 400 });
    }

    // --- PASO 1: VERIFICAR MEMORIA (CACHE) ---
    // Antes de gastar, miramos si ya lo chequeamos.
    // Referencia Documento: "Primero, buscar en Supabase si esa URL ya fue verificada" [cite: 446]

    const normalizedQuery = normalizeUrl(userQuery);

    // Buscamos coincidencia en la columna 'original_text_url' o una nueva columna de hash si quisieras ser más estricto
    const { data: cachedData, error: dbError } = await supabase
      .from('checks')
      .select('*')
      .ilike('original_text_url', `%${normalizedQuery}%`)
      .limit(1)
      .single();

    if (cachedData && !dbError) {
      console.log('¡Dato recuperado de la memoria! Ahorramos costos.');
      return NextResponse.json(cachedData.gemini_verdict); // Devolvemos el JSON guardado
    }

    // --- PASO 2: INVESTIGACIÓN (TAVILY) ---
    // Si no está en memoria, a laburar.
    console.log('Investigando con Tavily...');
    const searchResult = await tvly.search(userQuery, {
      searchDepth: "advanced",
      maxResults: 5,
    });

    const context = searchResult.results.map((r: any) => `${r.title}: ${r.content}`).join('\n');

    // --- PASO 3: ANÁLISIS (GEMINI) ---
    // Referencia Documento: Prompt del Sistema con personalidad argentina [cite: 627]
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" } // Forzamos JSON siempre
    });

    const prompt = `
      Actúa como un experto verificador de datos argentino ("El Avivador"). 
      Tu personalidad: Perspicaz, directo, usas lunfardo sutil ("es humo", "la posta", "ojo al piojo").
      
      Tarea: Analiza la veracidad del siguiente texto/URL basándote en las fuentes encontradas.
      
      Input Usuario: "${userQuery}"
      Fuentes encontradas: 
      ${context}

      Output JSON ESTRICTO requerido:
      {
        "verdict": "VERDADERO" | "FALSO" | "DUDOSO" | "SATIRA",
        "smoke_level": (número 0-100, donde 100 es puro humo/mentira),
        "title": "Título corto, irónico y ganchero",
        "summary": "Explicación de 3 líneas máximo, hablándole al usuario de 'vos'.",
        "diplomatic_message": "Un mensaje corto, amable y sin confrontación, redactado listo para copiar y pegar en un grupo de WhatsApp familiar para desmentir la noticia sin pelear.",
        "sources": [{"title": "Fuente", "url": "..."}]
      }
    `;

    console.log('Consultando a Gemini...');
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const verificationResult = JSON.parse(responseText);

    // --- PASO 4: GUARDAR EN MEMORIA (SUPABASE) ---
    // Guardamos para la próxima (Cachear el futuro)
    // Referencia Documento: Guardar diplomatic_message y smoke_level [cite: 572, 640]

    const { error: insertError } = await supabase
      .from('checks')
      .insert({
        original_text_url: userQuery, // Guardamos lo que puso el usuario
        gemini_verdict: verificationResult, // Guardamos el JSON completo de Gemini
        smoke_level: verificationResult.smoke_level, // Columna dedicada para analytics
        verdict: verificationResult.verdict // Columna dedicada para filtros rápidos
      });

    if (insertError) {
      console.error('Error guardando en Supabase:', insertError);
      // No frenamos el flujo, pero lo logueamos
    }

    return NextResponse.json(verificationResult);

  } catch (error: any) {
    console.error('Error en el proceso:', error);

    // --- MANEJO DE ERROR 429 (QUOTA EXCEEDED) ---
    // Esto arregla la pantalla roja que viste.
    if (error.message?.includes('429') || error.status === 429) {
      return NextResponse.json({
        verdict: "DUDOSO",
        title: "¡Se nos recalentó el mate!",
        summary: "Mucha gente avivándose al mismo tiempo. Google nos pidió un respiro. Probá en 1 minuto.",
        smoke_level: 50,
        sources: [],
        diplomatic_message: "Che, el sistema está saturado, pruebo en un rato."
      }, { status: 429 });
    }

    return NextResponse.json({ error: 'Error interno procesando la solicitud' }, { status: 500 });
  }
}