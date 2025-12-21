import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { headers } from "next/headers";

// --- CONFIGURACIÓN ---
const LIMIT_WINDOW_HOURS = 3; 
const LIMIT_MAX_REQUESTS = 3; // 3 intentos cada 3 horas por IP
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

// NUEVO PROMPT CON JERARQUÍA DE FUENTES
const SYSTEM_PROMPT = `
Eres "Sarasa Checker" (alias El Avivador), verificador argentino.
Tu misión: Desmentir "humo" o confirmar "la posta".
PERSONALIDAD: Coloquial, sutil, picante pero educado.

IMPORTANTE - JERARQUÍA DE FUENTES:
Analiza la credibilidad de cada fuente encontrada y clasifícala en el campo "type":
- "OFICIAL": Sitios de gobierno (.gov, .gob), organismos internacionales (WHO, UN), fuentes primarias directas.
- "MEDIO": Diarios reconocidos (Clarín, La Nación, Infobae, BBC, Reuters), agencias de noticias.
- "SOCIAL": Redes sociales (X, Facebook, TikTok), blogs personales, foros.
- "DUDOSO": Sitios de fake news conocidos, blogs conspiranoicos, fuentes sin autoría clara.

SALIDA JSON ESTRICTA:
{
  "verdict": "VERDADERO" | "FALSO" | "DUDOSO" | "SATIRA",
  "smoke_level": 0-100,
  "title": "Título irónico o directo",
  "summary": "Explicación breve (3 líneas).",
  "diplomatic_message": "Mensaje para copiar en WhatsApp.",
  "sources": [
    {
      "title": "Nombre del Medio", 
      "url": "Link", 
      "type": "OFICIAL" | "MEDIO" | "SOCIAL" | "DUDOSO" 
    }
  ]
}
`;

export async function POST(req: Request) {
  try {
    // 1. SEGURIDAD (Anti-Buitre)
    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for") || "unknown";

    const { data: requestCount, error: rateError } = await supabase.rpc('check_rate_limit', {
      check_ip: ip,
      window_hours: LIMIT_WINDOW_HOURS
    });

    if (rateError) console.error("Error rate limit:", rateError);

    if (requestCount >= LIMIT_MAX_REQUESTS && process.env.NODE_ENV !== 'development') {
      return NextResponse.json({
        error: "✋ ¡Epa! Pará la mano.",
        details: "Hiciste muchas consultas en poco tiempo. Tomate unos mates y volvé en un rato."
      }, { status: 429 });
    }

    // 2. PROCESAR INPUT
    const body = await req.json();
    const { urlOrText } = body;

    if (!urlOrText) return NextResponse.json({ error: "Falta la data, che." }, { status: 400 });

    await supabase.from('request_logs').insert({ ip: ip });

    // 3. DETECCIÓN DE TIPO
    const isUrl = /^(http|https|www)/.test(urlOrText);
    const searchSocket = isUrl 
      ? `Verificar veracidad de este link: "${urlOrText}"`
      : `Fact-check de esta afirmación: "${urlOrText.substring(0, 300)}..."`;

    // 4. TAVILY
    let context = "";
    console.log(`🕵️ Buscando en Tavily (${isUrl ? 'Modo URL' : 'Modo Texto'})...`);
    
    try {
      const tavilyResponse = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: process.env.TAVILY_API_KEY,
          query: searchSocket + " argentina contexto verdad mentira",
          search_depth: "advanced",
          include_answer: true,
          max_results: 5
        }),
      });
      
      const searchData = await tavilyResponse.json();
      context = searchData.results 
        ? searchData.results.map((r: any) => `- ${r.title}: ${r.content} (${r.url})`).join("\n") 
        : "No se encontraron fuentes externas. Analizar por lógica y conocimiento propio.";
        
    } catch (e) {
      console.error("Error Tavily:", e);
      context = "Error conectando con el buscador. Proceder con análisis lógico.";
    }

    // 5. GEMINI (MODELO FLASH-LATEST)
    console.log("🧠 Consultando a Gemini...");
    const model = genAI.getGenerativeModel({ 
        model: "gemini-flash-latest", 
        generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `
    INPUT DEL USUARIO: "${urlOrText}"
    EVIDENCIA DE INTERNET: ${context}
    Basado en la evidencia, generá el reporte JSON clasificando las fuentes.
    `;

    const result = await model.generateContent([SYSTEM_PROMPT, prompt]);
    const responseText = result.response.text();
    const jsonResponse = JSON.parse(responseText);

    // 6. GUARDAR
    const { error: dbError } = await supabase
      .from('checks')
      .insert({
        original_text_url: urlOrText,
        gemini_verdict: jsonResponse,
        verdict_status: jsonResponse.verdict,
        smoke_level: jsonResponse.smoke_level
      });

    if (dbError) console.error("Error guardando en DB:", dbError);

    return NextResponse.json(jsonResponse);

  } catch (error: any) {
    console.error("💥 Error fatal:", error);
    return NextResponse.json(
      { error: "Se rompió la matrix. " + (error.message || "Error desconocido") }, 
      { status: 500 }
    );
  }
}