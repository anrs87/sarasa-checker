'use client';

import { useEffect, useState } from 'react';
import { supabaseBrowser as supabase } from '@/lib/supabase-browser';
import { Clock } from 'lucide-react';

export default function RecentChecks() {
    const [checks, setChecks] = useState<any[]>([]);

    useEffect(() => {
        const fetchChecks = async () => {
            // Traemos los últimos 3 chequeos
            const { data } = await supabase
                .from('checks')
                .select('original_text_url, verdict_status, smoke_level, created_at')
                .order('created_at', { ascending: false })
                .limit(3);

            if (data) setChecks(data);
        };

        fetchChecks();
    }, []);

    if (checks.length === 0) return null;

    return (
        <div className="w-full max-w-xl mt-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <h3 className="text-center text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center justify-center gap-2">
                <Clock size={14} /> Recién salidos del horno
            </h3>

            <div className="grid gap-3">
                {checks.map((check, i) => (
                    <div key={i} className="bg-white/50 backdrop-blur-sm border border-gray-100 p-3 rounded-lg flex items-center justify-between gap-4 shadow-sm hover:shadow-md transition-all text-sm">
                        <div className="truncate flex-1 text-gray-600 font-medium">
                            "{check.original_text_url.substring(0, 50)}..."
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                            {/* Badge de Veredicto */}
                            <span className={`text-[10px] font-black px-2 py-1 rounded uppercase ${check.verdict_status === 'VERDADERO' ? 'bg-green-100 text-green-700' :
                                check.verdict_status === 'FALSO' ? 'bg-red-100 text-red-700' :
                                    'bg-yellow-100 text-yellow-700'
                                }`}>
                                {check.verdict_status}
                            </span>
                            {/* Nivel de Humo */}
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] font-bold text-gray-400">HUMO</span>
                                <span className={`font-black ${check.smoke_level > 50 ? 'text-red-500' : 'text-green-500'}`}>
                                    {check.smoke_level}%
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}