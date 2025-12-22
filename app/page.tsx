'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Search, AlertTriangle, ShieldAlert, Coffee } from 'lucide-react';
import ResultCard from '@/components/ResultCard';
import GuessOverlay from '@/components/GuessOverlay';
import RecentChecks from '@/components/RecentChecks';

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [userGuess, setUserGuess] = useState<'POSTA' | 'VERSO' | 'TIBIO' | null>(null);
  const [error, setError] = useState('');

  const handleCheck = async () => {
    // 1. VALIDACIÓN
    if (!url.trim()) return;

    if (url.trim().length < 5) {
      setError('Che, escribí algo más largo. Con dos letras no hacemos nada.');
      return;
    }

    // Reseteamos estados
    setLoading(true);
    setError('');
    setResult(null);
    setUserGuess(null);

    try {
      const res = await fetch('/api/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urlOrText: url }),
      });

      const data = await res.json();

      if (data.error) throw new Error(data.error);

      // --- GUARDADO LOCAL SILENCIOSO (HISTORIAL) ---
      // Guardamos en el navegador del usuario las últimas 10 búsquedas
      const history = JSON.parse(localStorage.getItem('sarasa_history') || '[]');
      const newEntry = {
        url,
        verdict: data.verdict,
        title: data.title, // Guardamos el título irónico
        date: new Date().toISOString()
      };
      localStorage.setItem('sarasa_history', JSON.stringify([newEntry, ...history].slice(0, 10)));
      // ----------------------------------------------------

      setResult(data);

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Se rompió algo. Probá de nuevo.');
      setLoading(false);
    }
  };

  const handleUserGuess = (guess: 'POSTA' | 'VERSO' | 'TIBIO') => {
    setUserGuess(guess);
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-background flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">

      {/* OVERLAY DEL PRODE */}
      {(loading || result) && !userGuess && !error && (
        <GuessOverlay onGuess={handleUserGuess} isLoading={!result} />
      )}

      {/* HEADER CON LOGO */}
      <div className="text-center mb-8 space-y-4 max-w-3xl z-10 flex flex-col items-center">
        <div className="relative w-full max-w-[280px] sm:max-w-[320px] h-auto aspect-[3/2]">
          <Image
            src="/logo.jpg"
            alt="Sarasa Checker Logo"
            width={600}
            height={400}
            className="object-contain drop-shadow-lg mix-blend-multiply"
            priority
          />
        </div>
        <p className="text-xl text-foreground/60 italic font-medium -mt-4">
          El avivador de giles
        </p>
      </div>

      {/* INPUT BUSCADOR */}
      <div className="w-full max-w-xl z-10 mb-6">
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary to-purple-600 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>

          <div className="relative bg-white rounded-lg p-2 shadow-xl flex items-center">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Pegá el link o texto sospechoso..."
              className="block w-full p-4 text-lg text-gray-900 placeholder-gray-500 bg-transparent border-none outline-none focus:ring-0"
              onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
            />
            <button
              onClick={handleCheck}
              disabled={loading && !result}
              className="bg-primary hover:bg-primary/90 text-white p-4 rounded-md transition-all font-bold tracking-wide flex items-center gap-2"
            >
              {(loading && !result) ? '...' : <Search size={24} />}
            </button>
          </div>
          <p className="text-xs text-center mt-3 text-gray-400">
            Tip: Si tiene candadito (Paywall), copiá y pegá el texto.
          </p>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 animate-in slide-in-from-top-2 border border-red-200">
            <AlertTriangle size={20} />
            {error}
          </div>
        )}
      </div>

      {/* BOTONES DE DONACIÓN SUTILES (CON TUS LINKS) */}
      {!result && !loading && (
        <div className="flex flex-wrap justify-center gap-4 mb-12 animate-in fade-in zoom-in duration-700 delay-300">
          <a
            href="https://cafecito.app/sarasachecker"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full text-sm font-medium transition-colors border border-slate-200"
          >
            <Coffee size={16} />
            Bancá la parada
          </a>
          <a
            href="https://ko-fi.com/sarasachecker"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full text-sm font-medium transition-colors border border-slate-200"
          >
            <span className="text-green-600 font-bold">$</span>
            Tirame un centro
          </a>
        </div>
      )}

      {/* TARJETA DE RESULTADO */}
      {result && userGuess && (
        <ResultCard data={result} userGuess={userGuess} />
      )}

      {/* MURO DE LA VERDAD (SOLO SI NO HAY RESULTADO ACTIVO) */}
      {!result && !loading && (
        <RecentChecks />
      )}

      {/* FOOTER LEGAL */}
      {!result && !loading && (
        <footer className="mt-auto text-center py-8 px-4 w-full max-w-2xl opacity-70 hover:opacity-100 transition-opacity">
          <div className="flex flex-col items-center gap-2 text-xs text-gray-500 border-t pt-6">
            <p className="font-semibold">Hecho con 🧉 y Gemini + Groq.</p>
            <div className="flex gap-2 items-start text-justify sm:text-center max-w-lg bg-slate-100 p-3 rounded-md">
              <ShieldAlert size={24} className="shrink-0 text-slate-400" />
              <p>
                <strong>Aviso Legal:</strong> Sarasa Checker utiliza Inteligencia Artificial experimental.
                Los resultados pueden contener errores ("pifies").
                Esta herramienta es con fines de entretenimiento y referencia rápida, no sustituye el juicio propio
                ni la consulta de fuentes oficiales.
              </p>
            </div>
          </div>
        </footer>
      )}
    </main>
  );
}