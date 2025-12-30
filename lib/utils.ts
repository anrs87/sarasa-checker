import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// NUEVA FUNCIÓN: EL LIMPIADOR AGRESIVO
export function normalizeUrl(input: string): string {
    try {
        // Si no parece URL (es texto plano), devolvemos el texto en minúsculas limpio
        if (!input.includes('.') || input.includes(' ')) {
            return input.trim().toLowerCase();
        }

        // Si le falta el protocolo, se lo agregamos para que URL() no chille
        const urlToParse = input.startsWith('http') ? input : `https://${input}`;
        const urlObj = new URL(urlToParse);

        // 1. Sacamos 'www.'
        const hostname = urlObj.hostname.replace(/^www\./, '');

        // 2. Sacamos la barra final '/'
        const pathname = urlObj.pathname.replace(/\/$/, '');

        // 3. NO incluimos urlObj.search (los parámetros ?utm=...)
        // Esto es clave: 'infobae.com/nota?id=1' pasa a ser 'infobae.com/nota'

        return `${hostname}${pathname}`.toLowerCase();
    } catch (e) {
        // Si falla el parseo, devolvemos el original limpio
        return input.trim().toLowerCase();
    }
}

// --- NUEVO: EL DESENROLLADOR DE REDES ---
export async function extractSocialContent(url: string): Promise<string | null> {
    try {
        // Nos hacemos pasar por el bot de Facebook/WhatsApp para que nos dejen pasar
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
                'Accept-Language': 'es-ES,es;q=0.9',
            },
            next: { revalidate: 3600 } // Cacheamos por 1 hora
        });

        if (!response.ok) return null;

        const html = await response.text();

        // Regex ninja para sacar título y descripción de los metadatos
        const titleMatch = html.match(/<meta property="og:title" content="([^"]*)"/);
        const descMatch = html.match(/<meta property="og:description" content="([^"]*)"/);

        const title = titleMatch ? titleMatch[1] : '';
        const description = descMatch ? descMatch[1] : '';

        // Si sacamos algo decente, lo devolvemos
        if (description && description.length > 20) {
            return `CONTEXTO REDES: Título: "${title}". Texto: "${description}"`;
        }

        return null;
    } catch (error) {
        console.error("Error scrapeando redes:", error);
        return null;
    }
}