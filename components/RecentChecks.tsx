'use client';

import { useEffect, useState } from 'react';
import { supabaseBrowser as supabase } from '@/lib/supabase-browser';
import { Clock, CheckCircle, AlertTriangle, XCircle, ChevronRight } from 'lucide-react';

// Definimos que este componente recibe una función "onSelect"
interface RecentChecksProps {
    onSelect: (checkData: any) => void;
}

export default function RecentChecks({ onSelect }: RecentChecksProps) {
    const [checks, setChecks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchChecks = async () => {
            const { data } = await supabase
                .from('checks')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(5);

            if (data) setChecks(data);
            setLoading(false);
        };

        fetchChecks();
    }, []);

    if (loading) return <div className="text-center text-xs text-gray-400 mt-8 animate-pulse">Buscando archivo...</div>;
    if (checks.length === 0) return null;

    // --- ACÁ ESTABA EL ERROR: Le ponemos 'any' explícito a verdict ---
    const getCardStyle = (verdict: any, smoke: number) => {
        // Normalizamos: si es objeto sacamos .verdict, si es string lo usamos directo, si es null usamos ''
        const v = (typeof verdict === 'string' ? verdict : verdict?.verdict || '').toUpperCase();

        if (v.includes('FALSO') || v.includes('VERSO') || smoke > 70) {
            return {
                border: 'border-l-red-500',
                bg: 'bg-red-50/80 hover:bg-red-100',
                text: 'text-red-700',
                icon: <XCircle size={16} className="text-red-500" />,
                label: 'HUMO'
            };
        }
        if (v.includes('VERDADERO') || v.includes('POSTA')) {
            return {
                border: 'border-l-green-500',
                bg: 'bg-green-50/80 hover:bg-green-100',
                text: 'text-green-700',
                icon: <CheckCircle size={16} className="text-green-500" />,
                label: 'LA POSTA'
            };
        }
        return {
            border: 'border-l-yellow-400',
            bg: 'bg-yellow-50/80 hover:bg-yellow-100',
            text: 'text-yellow-700',
            icon: <AlertTriangle size={16} className="text-yellow-500" />,
            label: 'DUDOSO'
        };
    };

    return (
        <div className="w-full max-w-xl mt-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 px-2 pb-10">
            <h3 className="text-center text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center justify-center gap-2">
                <Clock size={14} /> Recién salidos del horno
            </h3>

            <div className="grid gap-3">
                {checks.map((check, i) => {
                    // Preparamos la data para pasarla al click
                    const fullData = check.gemini_verdict || check;
                    const verdictData = fullData.verdict || check.verdict;

                    const style = getCardStyle(verdictData, check.smoke_level);

                    return (
                        <div
                            key={i}
                            // AL HACER CLICK: Ejecutamos la función que nos pasó el padre (page.tsx)
                            onClick={() => onSelect(fullData)}
                            className={`
                                relative overflow-hidden cursor-pointer group
                                backdrop-blur-sm border border-gray-100 
                                border-l-[6px] ${style.border} ${style.bg}
                                p-3 rounded-r-lg shadow-sm hover:shadow-md transition-all
                                active:scale-[0.98]
                                flex items-center justify-between gap-3
                            `}
                        >
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                                <div className="mt-1 shrink-0">
                                    {style.icon}
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className={`text-[10px] font-black uppercase tracking-wider mb-0.5 ${style.text}`}>
                                        {style.label}
                                    </span>
                                    <p className="text-sm text-gray-700 font-medium truncate w-full leading-tight">
                                        {check.title || `"${check.original_text_url.substring(0, 45)}..."`}
                                    </p>
                                </div>
                            </div>
                            <div className="text-gray-300 group-hover:text-gray-500 transition-colors">
                                <ChevronRight size={18} />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}