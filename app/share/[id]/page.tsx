import { createClient } from '@supabase/supabase-js';
import ResultCard from '@/components/ResultCard';
import Link from 'next/link';
import { Search } from 'lucide-react';
import type { Metadata, ResolvingMetadata } from 'next';

// Cliente Supabase para Server Component (solo lectura)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type Props = {
    params: { id: string }
}

// 1. GENERACIÓN DINÁMICA DE METADATA (Para que en WhatsApp salga lindo el título)
export async function generateMetadata(
    { params }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const { data } = await supabase
        .from('checks')
        .select('title, verdict')
        .eq('id', params.id)
        .single();

    if (!data) return { title: 'Chequeo no encontrado' };

    const emoji = data.verdict === 'VERDADERO' ? '✅' : data.verdict === 'FALSO' ? '❌' : '⚠️';

    return {
        title: `${emoji} ${data.title} | Sarasa Checker`,
        description: `Mirá el análisis de esta noticia. Veredicto: ${data.verdict}`,
        openGraph: {
            title: `${emoji} ${data.title}`,
            description: `Le pasamos el scanner a esto. Entrá para ver la posta.`,
        }
    };
}

// 2. LA PÁGINA EN SÍ
export default async function SharedResultPage({ params }: Props) {

    // Buscamos el chequeo por ID
    const { data: check, error } = await supabase
        .from('checks')
        .select('*')
        .eq('id', params.id)
        .single();

    if (error || !check) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
                <h1 className="text-2xl font-bold text-slate-800 mb-2">Uh, no encontramos ese chequeo.</h1>
                <p className="text-slate-600 mb-6">Capaz el link está viejo o roto.</p>
                <Link href="/" className="bg-primary text-white px-6 py-3 rounded-lg font-bold">
                    Ir al Inicio
                </Link>
            </div>
        );
    }

    // Preparamos la data para el componente
    const resultData = check.gemini_verdict;
    resultData.id = check.id; // Le inyectamos el ID

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center py-12 px-4">

            {/* HEADER SIMPLE */}
            <Link href="/" className="mb-8 flex flex-col items-center group">
                <div className="relative w-40 h-auto aspect-[3/2] cursor-pointer hover:scale-105 transition-transform">
                    {/* Asegurate de tener logo.jpg en public */}
                    <img src="/logo.jpg" alt="Sarasa Checker" className="object-contain mix-blend-multiply" />
                </div>
            </Link>

            {/* LA TARJETA CON LA DATA */}
            {/* userGuess="TIBIO" hace que muestre el resultado directo sin jugar al Prode */}
            <ResultCard data={resultData} userGuess="TIBIO" />

            {/* CALL TO ACTION */}
            <div className="mt-8 text-center animate-in slide-in-from-bottom-4 delay-500">
                <p className="text-slate-600 mb-4 font-medium">¿Vos también tenés una duda?</p>
                <Link href="/" className="inline-flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-full font-bold hover:bg-slate-800 transition-all hover:scale-105 shadow-lg">
                    <Search size={20} />
                    Chequear otra cosa
                </Link>
            </div>

        </div>
    );
}