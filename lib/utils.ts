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