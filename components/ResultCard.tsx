import { useState } from 'react';
import { Check, Copy, ExternalLink, Coffee, DollarSign, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils'; // Asegurate de haber creado el archivo lib/utils.ts que te pasé antes

// Definimos los tipos para que TypeScript no se queje y te ayude con el autocompletado
interface Source {
    title: string;
    url: string;
    type?: 'OFICIAL' | 'MEDIO' | 'SOCIAL' | 'DUDOSO'; // Opcional por si la IA se olvida de mandarlo
}

interface ResultData {
    verdict: 'VERDADERO' | 'FALSO' | 'DUDOSO' | 'SATIRA';
    smoke_level: number;
    title: string;
    summary: string;
    diplomatic_message: string;
    sources: Source[];
}

interface ResultCardProps {
    data: ResultData;
    userGuess: 'POSTA' | 'VERSO' | 'TIBIO' | null;
}

export default function ResultCard({ data, userGuess }: ResultCardProps) {
    const [copied, setCopied] = useState(false);

    const isFake = data.smoke_level > 50;

    // --- LÓGICA DE GAMIFICATION (Tu toque maestro) ---
    let badgeText = "";
    let badgeColor = "";

    if (userGuess === 'TIBIO') {
        badgeText = "🐢 Ni fu ni fa. El que no arriesga no gana.";
        badgeColor = "bg-slate-500";
    } else if (userGuess) {
        const userGuessedFake = userGuess === 'VERSO';
        // Logic: Si es fake y dijiste verso (Hit) O si es verdad y dijiste posta (Hit)
        const hit = (isFake && userGuessedFake) || (!isFake && !userGuessedFake);

        if (hit) {
            badgeText = "🎯 ¡Estás afilado! La viste venir.";
            badgeColor = "bg-status-truth"; // Requiere configurar tailwind.config.ts
        } else {
            badgeText = "🛡️ ¡Te salvamos! Entraste como un caballo.";
            badgeColor = "bg-status-fake"; // Requiere configurar tailwind.config.ts
        }
    }

    // Helper para copiar al portapapeles
    const handleCopy = () => {
        navigator.clipboard.writeText(data.diplomatic_message);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="w-full max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* 1. BADGE DEL PRODE (Solo si el usuario votó) */}
            {userGuess && (
                <div className={cn(
                    "text-center py-2 px-6 rounded-full text-sm font-bold tracking-wide uppercase mx-auto w-fit shadow-lg text-white transform hover:scale-105 transition-transform",
                    badgeColor
                )}>
                    {badgeText}
                </div>
            )}

            {/* 2. TARJETA PRINCIPAL */}
            <div className="bg-white border-2 border-slate-900 rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">

                {/* Encabezado con Color Dinámico */}
                <div className={cn(
                    "p-6 text-center text-white relative overflow-hidden",
                    data.verdict === 'VERDADERO' && "bg-status-truth",
                    data.verdict === 'FALSO' && "bg-status-fake",
                    data.verdict === 'DUDOSO' && "bg-status-warning text-slate-900",
                    data.verdict === 'SATIRA' && "bg-status-satire",
                )}>
                    {/* Pattern de fondo sutil */}
                    <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>

                    <h2 className="relative z-10 text-3xl md:text-4xl font-black uppercase italic tracking-tighter mb-2 drop-shadow-sm">
                        {data.verdict}
                    </h2>
                    <p className="relative z-10 text-lg font-bold opacity-90 line-clamp-2 px-4">
                        "{data.title}"
                    </p>

                    {/* El Humómetro Visual */}
                    <div className="mt-6 relative z-10">
                        <div className="flex justify-between text-xs font-bold uppercase mb-1 opacity-80">
                            <span>Verdad</span>
                            <span>Humo ({data.smoke_level}%)</span>
                        </div>
                        <div className="h-3 bg-black/20 rounded-full overflow-hidden border border-black/10">
                            <div
                                className="h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all duration-1000 ease-out"
                                style={{ width: `${data.smoke_level}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Cuerpo de la Tarjeta */}
                <div className="p-6 space-y-6">

                    {/* Resumen */}
                    <p className="text-lg text-slate-700 leading-relaxed font-medium">
                        {data.summary}
                    </p>

                    {/* MENSAJE PARA WHATSAPP (Diplomático) */}
                    <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 relative group hover:border-green-400 transition-colors">
                        <div className="absolute -top-3 left-4 bg-green-600 text-white text-xs font-black px-3 py-1 rounded uppercase tracking-wider shadow-sm">
                            Para el Grupo
                        </div>
                        <p className="text-slate-600 italic mt-2 mb-4 pr-2 font-serif">
                            "{data.diplomatic_message}"
                        </p>
                        <button
                            onClick={handleCopy}
                            className="w-full flex items-center justify-center gap-2 bg-white border-2 border-green-200 hover:border-green-500 hover:text-green-700 text-slate-600 font-bold py-2 px-4 rounded-md transition-all"
                        >
                            {copied ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
                            {copied ? '¡Copiado!' : 'Copiar mensaje'}
                        </button>
                    </div>

                    {/* FUENTES CON SEMÁFORO DE CREDIBILIDAD */}
                    {data.sources && data.sources.length > 0 && (
                        <div className="text-sm border-t-2 border-slate-100 pt-4">
                            <h4 className="font-black mb-3 flex items-center gap-2 text-slate-400 uppercase text-xs tracking-wider">
                                <ExternalLink size={14} /> Fuentes Analizadas
                            </h4>
                            <ul className="space-y-2">
                                {data.sources.map((s, i) => {
                                    // Lógica de colores según el tipo de fuente (Tu lógica original)
                                    let badgeClass = "bg-gray-100 text-gray-600 border-gray-200";
                                    let icon = "🔗";

                                    // Nota: Si el backend no manda 'type', usa el default
                                    if (s.type === 'OFICIAL') { badgeClass = "bg-blue-100 text-blue-700 border-blue-200"; icon = "🏛️"; }
                                    if (s.type === 'MEDIO') { badgeClass = "bg-emerald-100 text-emerald-700 border-emerald-200"; icon = "📰"; }
                                    if (s.type === 'SOCIAL') { badgeClass = "bg-orange-100 text-orange-700 border-orange-200"; icon = "📱"; }
                                    if (s.type === 'DUDOSO') { badgeClass = "bg-red-100 text-red-700 border-red-200"; icon = "⚠️"; }

                                    return (
                                        <li key={i} className="flex items-center justify-between gap-3 group">
                                            <a
                                                href={s.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-slate-600 hover:text-blue-600 hover:underline truncate flex-1 font-bold transition-colors"
                                            >
                                                {s.title || s.url}
                                            </a>
                                            <span className={cn("text-[10px] font-black px-2 py-1 rounded border flex items-center gap-1 shrink-0 uppercase", badgeClass)}>
                                                {icon} {s.type || 'WEB'}
                                            </span>
                                        </li>
                                    )
                                })}
                            </ul>
                        </div>
                    )}
                </div>

                {/* FOOTER: DONACIONES */}
                <div className="bg-slate-50 p-6 border-t-2 border-slate-200 text-center space-y-4">
                    <p className="text-sm text-slate-500 font-medium">
                        Mantenemos esto a pulmón. Vos fijate de qué lado de la mecha te encontrás hoy:
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <a
                            href={process.env.NEXT_PUBLIC_CAFECITO_URL || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 px-5 py-3 bg-[#00bfa5] text-white rounded-lg font-black shadow-sm hover:shadow-md transition-all hover:-translate-y-1 active:translate-y-0"
                        >
                            <Coffee size={18} /> Cafecito
                        </a>
                        <a
                            href={process.env.NEXT_PUBLIC_KOFI_URL || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 px-5 py-3 bg-[#29abe0] text-white rounded-lg font-black shadow-sm hover:shadow-md transition-all hover:-translate-y-1 active:translate-y-0"
                        >
                            <DollarSign size={18} /> Ko-fi (USD)
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}