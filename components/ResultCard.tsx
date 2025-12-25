import { useState } from 'react';
import { Check, ExternalLink, Coffee, DollarSign, Share2, X, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Source {
    title: string;
    url: string;
    type?: 'OFICIAL' | 'MEDIO' | 'SOCIAL' | 'DUDOSO';
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
    onReset: () => void; // <--- AGREGAMOS ESTA PROP PARA PODER CERRAR
}

export default function ResultCard({ data, userGuess, onReset }: ResultCardProps) {
    const [copied, setCopied] = useState(false);

    const isFake = data.smoke_level > 50;

    // --- HELPER PARA URLS SEGURAS ---
    const getSafeUrl = (url: string) => {
        if (!url) return '#';
        if (url.startsWith('http')) return url;
        return `https://${url}`;
    };

    // --- LOGICA GAMIFICATION ---
    let badgeText = "";
    let badgeColor = "";

    if (userGuess === 'TIBIO') {
        badgeText = "🐢 Ni fu ni fa. El que no arriesga no gana.";
        badgeColor = "bg-slate-500";
    } else if (userGuess) {
        const userGuessedFake = userGuess === 'VERSO';
        const hit = (isFake && userGuessedFake) || (!isFake && !userGuessedFake);

        if (hit) {
            badgeText = "🎯 ¡Estás afilado! La viste venir.";
            badgeColor = "bg-green-600";
        } else {
            badgeText = "🛡️ ¡Te salvamos! Entraste como un caballo.";
            badgeColor = "bg-red-600";
        }
    }

    const handleCopy = () => {
        const emojiVerdict = data.verdict === 'VERDADERO' ? '✅' : data.verdict === 'FALSO' ? '❌' : '⚠️';
        const sourceLink = data.sources?.[0]?.url || 'Fuente no disponible';
        const fullMessage = `*${emojiVerdict} VEREDICTO: ${data.verdict}*\n\n"${data.title}"\n\n💬 ${data.diplomatic_message}\n\n🔍 Fuente: ${sourceLink}\n\n👉 Chequealo vos en: https://sarasa-checker.vercel.app`;

        navigator.clipboard.writeText(fullMessage);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="w-full max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12 relative">

            {/* BADGE DEL PRODE */}
            {userGuess && (
                <div className={cn(
                    "text-center py-2 px-6 rounded-full text-sm font-bold tracking-wide uppercase mx-auto w-fit shadow-lg text-white transform hover:scale-105 transition-transform",
                    badgeColor
                )}>
                    {badgeText}
                </div>
            )}

            {/* TARJETA PRINCIPAL */}
            <div className="bg-white border-2 border-slate-900 rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden relative">

                {/* BOTÓN DE CERRAR (LA "X") */}
                <button
                    onClick={onReset}
                    className="absolute top-4 right-4 z-20 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full transition-colors backdrop-blur-sm"
                    title="Cerrar y volver al inicio"
                >
                    <X size={20} />
                </button>

                {/* Encabezado */}
                <div className={cn(
                    "p-6 text-center text-white relative overflow-hidden",
                    data.verdict === 'VERDADERO' && "bg-green-500",
                    data.verdict === 'FALSO' && "bg-red-500",
                    data.verdict === 'DUDOSO' && "bg-yellow-400 text-slate-900",
                    data.verdict === 'SATIRA' && "bg-purple-500",
                )}>
                    <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>

                    <h2 className="relative z-10 text-3xl md:text-4xl font-black uppercase italic tracking-tighter mb-2 drop-shadow-sm pr-8 pl-8">
                        {data.verdict}
                    </h2>
                    <p className="relative z-10 text-lg font-bold opacity-90 line-clamp-2 px-4">
                        "{data.title}"
                    </p>

                    {/* Humómetro */}
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

                {/* Cuerpo */}
                <div className="p-6 space-y-6">

                    <p className="text-lg text-slate-700 leading-relaxed font-medium">
                        {data.summary}
                    </p>

                    {/* BOTÓN DE COMPARTIR */}
                    <div className="bg-slate-50 border-2 border-slate-200 rounded-lg p-4 relative group hover:border-slate-400 transition-colors">
                        <div className="absolute -top-3 left-4 bg-slate-700 text-white text-xs font-black px-3 py-1 rounded uppercase tracking-wider shadow-sm">
                            Compartir Resultado
                        </div>
                        <p className="text-slate-500 italic mt-2 mb-4 pr-2 font-serif text-sm">
                            "{data.diplomatic_message}..."
                        </p>
                        <button
                            onClick={handleCopy}
                            className="w-full flex items-center justify-center gap-2 bg-white border-2 border-slate-300 hover:border-blue-500 hover:text-blue-700 text-slate-700 font-bold py-3 px-4 rounded-md transition-all shadow-sm active:translate-y-1"
                        >
                            {copied ? <Check size={20} className="text-green-600" /> : <Share2 size={20} />}
                            {copied ? '¡Copiado al portapapeles!' : 'Copiar Informe Completo'}
                        </button>
                    </div>

                    {/* FUENTES */}
                    {data.sources && data.sources.length > 0 && (
                        <div className="text-sm border-t-2 border-slate-100 pt-4">
                            <h4 className="font-black mb-3 flex items-center gap-2 text-slate-400 uppercase text-xs tracking-wider">
                                <ExternalLink size={14} /> Fuentes Analizadas
                            </h4>
                            <ul className="space-y-2">
                                {data.sources.map((s, i) => (
                                    <li key={i} className="flex items-center justify-between gap-3 group">
                                        <a
                                            href={getSafeUrl(s.url)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-slate-600 hover:text-blue-600 hover:underline truncate flex-1 font-bold transition-colors"
                                        >
                                            {s.title || s.url}
                                        </a>
                                        <a
                                            href={getSafeUrl(s.url)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[10px] font-black px-3 py-1.5 rounded border bg-slate-100 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 text-slate-600 border-slate-200 flex items-center gap-1 shrink-0 uppercase transition-all cursor-pointer"
                                        >
                                            🔗 WEB
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* FOOTER DONACIONES */}
                <div className="bg-slate-50 p-6 border-t-2 border-slate-200 text-center space-y-4">
                    <p className="text-sm text-slate-500 font-medium">
                        Mantenemos esto a pulmón. Vos fijate de qué lado de la mecha te encontrás hoy:
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <a
                            href="https://cafecito.app/sarasachecker"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 px-5 py-3 bg-[#00bfa5] text-white rounded-lg font-black shadow-sm hover:shadow-md transition-all hover:-translate-y-1 active:translate-y-0"
                        >
                            <Coffee size={18} /> Cafecito
                        </a>
                        <a
                            href="https://ko-fi.com/sarasachecker"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 px-5 py-3 bg-[#29abe0] text-white rounded-lg font-black shadow-sm hover:shadow-md transition-all hover:-translate-y-1 active:translate-y-0"
                        >
                            <DollarSign size={18} /> Ko-fi (USD)
                        </a>
                    </div>
                </div>
            </div>

            {/* BOTÓN VOLVER GRANDE (FUERA DE LA CARD) */}
            <button
                onClick={onReset}
                className="w-full bg-slate-800 hover:bg-slate-900 text-slate-300 py-4 rounded-xl font-bold tracking-wide flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg active:scale-95"
            >
                <RotateCcw size={20} />
                Checkear otra cosa
            </button>

        </div>
    );
}