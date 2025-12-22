'use client';

import { useEffect, useState } from 'react';
import { supabaseBrowser as supabase } from '@/lib/supabase-browser';
import { Clock, Flame, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

export default function RecentChecks() {
    const [checks, setChecks] = useState<any[]>([]);

    useEffect(() => {
        const fetchChecks = async () => {
            // CORRECCIÓN: Pedimos 'verdict' en lugar de 'verdict_status'
            // También pedimos 'title' para que se vea más lindo que la URL
            const { data } = await supabase
                .from('checks')
                .select('original_text_url, title, verdict, smoke_level, created_at')
                .order('created_at', { ascending: false })
                .limit(5); // Subí a 5 para que no quede tan vacío

            if (data) setChecks(data);
        };

        fetchChecks();
    }, []);

    if (checks.length === 0) return null;

    // Helper para definir estilos según el veredicto
    const getCardStyle = (verdict: string, smoke: number) => {
        const v = verdict?.toUpperCase() || '';

        // Caso FALSO o mucho humo
        if (v.includes('FALSO') || v.includes('VERSO') || smoke > 70) {
            return {
                border: 'border-l-red-500',
                bg: 'bg-red-50/80',
                text: 'text-red-700',
                icon: <XCircle size={16} className="text-red-500" />,
                label: 'HUMO'
            };
        }
        // Caso VERDADERO
        if (v.includes('VERDADERO') || v.includes('POSTA')) {
            return {
                border: 'border-l-green-500',
                bg: 'bg-green-50/80',
                text: 'text-green-700',
                icon: <CheckCircle size={16} className="text-green-500" />,
                label: 'LA POSTA'
            };
        }
        // Default (Dudoso / Tibio)
        return {
            border: 'border-l-yellow-400',
            bg: 'bg-yellow-50/80',
            text: 'text-yellow-700',
            icon: <AlertTriangle size={16} className="text-yellow-500" />,
            label: 'DUDOSO'
        };
    };

    return (
        <div className="w-full max-w-xl mt-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 px-2">
            <h3 className="text-center text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center justify-center gap-2">
                <Clock size={14} /> Recién salidos del horno
            </h3>

            <div className="grid gap-3">
                {checks.map((check, i) => {
                    const style = getCardStyle(check.verdict, check.smoke_level);

                    return (
                        <div key={i} className={`
                            relative overflow-hidden
                            backdrop-blur-sm border border-gray-100 
                            border-l-[6px] ${style.border} ${style.bg}
                            p-3 rounded-r-lg shadow-sm hover:shadow-md transition-all
                            flex items-center justify-between gap-3
                        `}>
                            {/* Icono + Texto */}
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                                <div className="mt-1 shrink-0">
                                    {style.icon}
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className={`text-[10px] font-black uppercase tracking-wider mb-0.5 ${style.text}`}>
                                        {style.label}
                                    </span>
                                    <p className="text-sm text-gray-700 font-medium truncate w-full leading-tight">
                                        {/* Usamos el Título si existe, sino cortamos la URL */}
                                        {check.title ? check.title : `"${check.original_text_url.substring(0, 45)}..."`}
                                    </p>
                                </div>
                            </div>

                            {/* Medidor de Humo (solo si es relevante) */}
                            {check.smoke_level > 0 && (
                                <div className="flex flex-col items-center justify-center pl-3 border-l border-gray-200/50 shrink-0">
                                    <Flame size={14} className={check.smoke_level > 50 ? "text-orange-500" : "text-gray-400"} />
                                    <span className="text-[10px] font-bold text-gray-500">
                                        {check.smoke_level}%
                                    </span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}