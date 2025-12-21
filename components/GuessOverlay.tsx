import { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, Meh } from 'lucide-react'; // Agregamos ícono Meh para el tibio
import { cn } from '@/lib/utils';

interface GuessOverlayProps {
    onGuess: (guess: 'POSTA' | 'VERSO' | 'TIBIO') => void;
    isLoading: boolean;
}

export default function GuessOverlay({ onGuess, isLoading }: GuessOverlayProps) {
    const loadingTexts = ["Escaneando la sarasa...", "Buscando papeles...", "Midiendo nivel de humo...", "Consultando al VAR..."];
    const [idx, setIdx] = useState(0);

    // Nuevo estado para saber qué eligió el usuario antes de confirmar
    const [selected, setSelected] = useState<'POSTA' | 'VERSO' | 'TIBIO' | null>(null);

    useEffect(() => {
        if (!isLoading) return;
        const i = setInterval(() => setIdx(p => (p + 1) % loadingTexts.length), 2000);
        return () => clearInterval(i);
    }, [isLoading]);

    const handleConfirm = () => {
        if (selected) {
            onGuess(selected);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center p-4 animate-in fade-in duration-300">

            {/* 1. ESTADO DE CARGA */}
            {isLoading ? (
                <div className="flex flex-col items-center space-y-6 mb-8">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-xl font-medium animate-pulse text-center">{loadingTexts[idx]}</p>
                </div>
            ) : (
                <div className="mb-8 text-center animate-in zoom-in duration-300">
                    <div className="text-5xl mb-2">✅</div>
                    <p className="text-xl font-bold text-primary">¡Veredicto listo!</p>
                    <p className="text-sm text-gray-500">Jugatelá para verlo.</p>
                </div>
            )}

            {/* 2. TARJETA DE VOTACIÓN */}
            <div className="bg-card border border-border p-6 sm:p-8 rounded-xl shadow-2xl text-center max-w-md w-full">
                <h3 className="text-2xl font-black mb-6 uppercase tracking-tight">
                    ¿Qué te dice tu instinto?
                </h3>

                <div className="grid grid-cols-2 gap-4 mb-4">
                    {/* OPCIÓN: POSTA */}
                    <button
                        onClick={() => setSelected('POSTA')}
                        className={cn(
                            "group flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all duration-200",
                            selected === 'POSTA'
                                ? "border-status-truth bg-status-truth/10 text-status-truth scale-105 shadow-lg"
                                : "border-transparent bg-slate-50 hover:bg-slate-100 text-gray-400 grayscale hover:grayscale-0"
                        )}
                    >
                        <ThumbsUp size={32} className={cn("transition-transform", selected === 'POSTA' && "scale-110")} />
                        <span className="font-bold">ES POSTA</span>
                    </button>

                    {/* OPCIÓN: VERSO */}
                    <button
                        onClick={() => setSelected('VERSO')}
                        className={cn(
                            "group flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all duration-200",
                            selected === 'VERSO'
                                ? "border-status-fake bg-status-fake/10 text-status-fake scale-105 shadow-lg"
                                : "border-transparent bg-slate-50 hover:bg-slate-100 text-gray-400 grayscale hover:grayscale-0"
                        )}
                    >
                        <ThumbsDown size={32} className={cn("transition-transform", selected === 'VERSO' && "scale-110")} />
                        <span className="font-bold">ES VERSO</span>
                    </button>
                </div>

                {/* OPCIÓN: TIBIO (Tercer botón) */}
                <button
                    onClick={() => setSelected('TIBIO')}
                    className={cn(
                        "w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all mb-6 border",
                        selected === 'TIBIO'
                            ? "bg-slate-200 text-slate-800 border-slate-400 shadow-inner"
                            : "bg-transparent text-slate-400 border-transparent hover:bg-slate-50 hover:text-slate-600"
                    )}
                >
                    <Meh size={18} />
                    <span>Prefiero no opinar (Soy tibio)</span>
                </button>

                {/* BOTÓN CONFIRMAR (Solo aparece si elegiste algo) */}
                <button
                    onClick={handleConfirm}
                    disabled={!selected}
                    className={cn(
                        "w-full py-4 rounded-lg font-black tracking-widest uppercase transition-all transform",
                        selected
                            ? "bg-primary text-white shadow-xl hover:scale-105 hover:bg-primary/90 cursor-pointer"
                            : "bg-slate-200 text-slate-400 cursor-not-allowed"
                    )}
                >
                    {selected ? 'VER LA VERDAD' : 'ELEGÍ UNA OPCIÓN'}
                </button>
            </div>
        </div>
    );
}