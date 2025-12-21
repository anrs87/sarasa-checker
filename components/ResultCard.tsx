import { useState } from 'react';
import { Check, Copy, ExternalLink, Coffee, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResultCardProps {
    data: any;
    userGuess: 'POSTA' | 'VERSO' | 'TIBIO';
}

export default function ResultCard({ data, userGuess }: ResultCardProps) {
    const [copied, setCopied] = useState(false);

    const isFake = data.smoke_level > 50;

    // Lógica de gamification
    let badgeText = "";
    let badgeColor = "";

    if (userGuess === 'TIBIO') {
        badgeText = "🐢 Ni fu ni fa. El que no arriesga no gana.";
        badgeColor = "bg-slate-500";
    } else {
        const userGuessedFake = userGuess === 'VERSO';
        const hit = (isFake && userGuessedFake) || (!isFake && !userGuessedFake);

        if (hit) {
            badgeText = "🎯 ¡Estás afilado! La viste venir.";
            badgeColor = "bg-status-truth";
        } else {
            badgeText = "🛡️ ¡Te salvamos! Entraste como un caballo.";
            badgeColor = "bg-status-fake";
        }
    }

    return (
        <div className="w-full max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* BADGE DEL PRODE */}
            <div className={cn(
                "text-center py-2 px-4 rounded-full text-sm font-bold tracking-wide uppercase mx-auto w-fit shadow-md text-white",
                badgeColor
            )}>
                {badgeText}
            </div>

            {/* TARJETA PRINCIPAL */}
            <div className="bg-card border border-border rounded-lg shadow-xl overflow-hidden">

                {/* Encabezado */}
                <div className={cn(
                    "p-6 text-center text-white",
                    data.verdict === 'VERDADERO' && "bg-status-truth",
                    data.verdict === 'FALSO' && "bg-status-fake",
                    data.verdict === 'DUDOSO' && "bg-status-warning text-black",
                    data.verdict === 'SATIRA' && "bg-status-satire",
                )}>
                    <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-2">
                        {data.title || data.verdict}
                    </h2>
                    <div className="flex items-center justify-center gap-2 font-medium opacity-90">
                        <span>Nivel de Humo: {data.smoke_level}%</span>
                    </div>
                    {/* Barra de Humo */}
                    <div className="mt-4 h-2 bg-black/20 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-white/90 transition-all duration-1000 ease-out"
                            style={{ width: `${data.smoke_level}%` }}
                        />
                    </div>
                </div>

                {/* Cuerpo */}
                <div className="p-6 space-y-6">
                    <p className="text-lg text-foreground/80 leading-relaxed">
                        {data.summary}
                    </p>

                    {/* MENSAJE WHATSAPP */}
                    <div className="bg-background border border-border rounded-lg p-4 relative group">
                        <div className="absolute -top-3 left-4 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded uppercase">
                            Para WhatsApp
                        </div>
                        <p className="text-sm text-foreground/70 italic pr-10">
                            "{data.diplomatic_message}"
                        </p>
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(data.diplomatic_message);
                                setCopied(true);
                                setTimeout(() => setCopied(false), 2000);
                            }}
                            className="absolute top-2 right-2 p-2 hover:bg-slate-100 rounded-md transition-colors text-primary"
                            title="Copiar mensaje"
                        >
                            {copied ? <Check size={18} /> : <Copy size={18} />}
                        </button>
                    </div>

                    {/* FUENTES CON SEMÁFORO DE CREDIBILIDAD */}
                    {data.sources && data.sources.length > 0 && (
                        <div className="text-sm border-t pt-4 bg-slate-50/50 p-4 rounded-b-lg">
                            <h4 className="font-bold mb-3 flex items-center gap-2 text-foreground/70 uppercase text-xs tracking-wider">
                                <ExternalLink size={14} /> Fuentes Analizadas:
                            </h4>
                            <ul className="space-y-2">
                                {data.sources.map((s: any, i: number) => {
                                    // Lógica de colores según el tipo de fuente
                                    let badgeColor = "bg-gray-100 text-gray-600 border-gray-200"; // Default
                                    let icon = "🔗";

                                    if (s.type === 'OFICIAL') { badgeColor = "bg-blue-100 text-blue-700 border-blue-200"; icon = "🏛️"; }
                                    if (s.type === 'MEDIO') { badgeColor = "bg-emerald-100 text-emerald-700 border-emerald-200"; icon = "📰"; }
                                    if (s.type === 'SOCIAL') { badgeColor = "bg-orange-100 text-orange-700 border-orange-200"; icon = "📱"; }
                                    if (s.type === 'DUDOSO') { badgeColor = "bg-red-100 text-red-700 border-red-200"; icon = "⚠️"; }

                                    return (
                                        <li key={i} className="flex items-center justify-between gap-2 group">
                                            <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate flex-1 font-medium">
                                                {s.title || s.url}
                                            </a>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeColor} flex items-center gap-1 shrink-0`}>
                                                {icon} {s.type || 'WEB'}
                                            </span>
                                        </li>
                                    )
                                })}
                            </ul>
                        </div>
                    )}
                </div>

                {/* DONACIONES */}
                <div className="bg-slate-50 p-6 border-t border-border text-center space-y-4">
                    <p className="text-sm text-foreground/60">
                        Mantenemos esto a pulmón. Vos fijate de qué lado de la mecha te encontrás hoy:
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <a
                            href={process.env.NEXT_PUBLIC_CAFECITO_URL}
                            target="_blank"
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-[#00bfa5] text-white rounded-lg font-bold shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
                        >
                            <Coffee size={18} /> Bancá la parada (Pesos)
                        </a>
                        <a
                            href={process.env.NEXT_PUBLIC_KOFI_URL}
                            target="_blank"
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-[#29abe0] text-white rounded-lg font-bold shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
                        >
                            <DollarSign size={18} /> ¿Te sobraron verdes?
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}