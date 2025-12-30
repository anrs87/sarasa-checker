'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Search, AlertTriangle, Coffee, DollarSign, Link as LinkIcon, FileText, Image as ImageIcon, X, Camera } from 'lucide-react';
import ResultCard from '@/components/ResultCard';
import GuessOverlay from '@/components/GuessOverlay';
import RecentChecks from '@/components/RecentChecks';

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [userGuess, setUserGuess] = useState<'POSTA' | 'VERSO' | 'TIBIO' | null>(null);
  const [error, setError] = useState('');

  // --- NUEVO ESTADO PARA IMAGEN ---
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) { // 4MB límite
        setError('Esa imagen es muy pesada. Buscate una más liviana.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setError('');
        setUrl(''); // Limpiamos texto para evitar confusión
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- FUNCIÓN PARA LIMPIAR TODO ---
  const resetState = () => {
    setResult(null);
    setUserGuess(null);
    setUrl('');
    clearImage();
    setLoading(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCheck = async () => {
    // 1. VALIDACIÓN HÍBRIDA
    if (!url.trim() && !selectedImage) return;

    if (!selectedImage && url.trim().length < 5) {
      setError('Che, escribí algo más largo. Con dos letras no hacemos nada.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);
    setUserGuess(null);

    try {
      const res = await fetch('/api/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          urlOrText: url,
          imageBase64: selectedImage // Mandamos la foto si hay
        }),
      });

      const data = await res.json();

      if (data.error) throw new Error(data.error);

      // --- GUARDADO LOCAL SILENCIOSO ---
      const history = JSON.parse(localStorage.getItem('sarasa_history') || '[]');
      const newEntry = {
        url: selectedImage ? '📸 Análisis de Imagen' : url,
        verdict: data.verdict,
        title: data.title,
        date: new Date().toISOString()
      };
      localStorage.setItem('sarasa_history', JSON.stringify([newEntry, ...history].slice(0, 10)));

      setResult(data);
      // Limpiamos imagen después del éxito
      if (selectedImage) clearImage();

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

  const handleSelectFromHistory = (data: any) => {
    setResult(data);
    setUserGuess('TIBIO');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col items-center w-full py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">

      {(loading || result) && !userGuess && !error && (
        <GuessOverlay onGuess={handleUserGuess} isLoading={!result} />
      )}

      {/* HEADER */}
      <div className="text-center mb-6 space-y-2 max-w-3xl z-10 flex flex-col items-center">
        <div
          onClick={resetState}
          className="relative w-full max-w-[280px] sm:max-w-[320px] h-auto aspect-[3/2] cursor-pointer hover:scale-105 transition-transform"
          title="Volver al inicio"
        >
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

      {/* --- INSTRUCCIONES VISUALES (Se ven si no hay resultado) --- */}
      {!result && !loading && (
        <div className="flex justify-center gap-2 sm:gap-4 mb-6 w-full max-w-xl px-2 animate-in fade-in slide-in-from-bottom-3">

          {/* OPCIÓN 1: LINK */}
          <div className="flex flex-col items-center gap-1 p-2 flex-1 bg-white/60 backdrop-blur-md rounded-xl border border-slate-200 shadow-sm text-center hover:scale-105 transition-transform duration-200">
            <div className="p-2.5 bg-blue-100 text-blue-600 rounded-full mb-1">
              <LinkIcon size={20} />
            </div>
            <span className="text-sm font-bold text-slate-700">Link</span>
            <span className="text-[10px] sm:text-xs text-slate-500 leading-tight">
              De noticia o red social
            </span>
          </div>

          {/* OPCIÓN 2: TEXTO */}
          <div className="flex flex-col items-center gap-1 p-2 flex-1 bg-white/60 backdrop-blur-md rounded-xl border border-slate-200 shadow-sm text-center hover:scale-105 transition-transform duration-200">
            <div className="p-2.5 bg-purple-100 text-purple-600 rounded-full mb-1">
              <FileText size={20} />
            </div>
            <span className="text-sm font-bold text-slate-700">Texto</span>
            <span className="text-[10px] sm:text-xs text-slate-500 leading-tight">
              Si la nota tiene candado 🔒
            </span>
          </div>

          {/* OPCIÓN 3: FOTO */}
          <div className="flex flex-col items-center gap-1 p-2 flex-1 bg-white/60 backdrop-blur-md rounded-xl border border-slate-200 shadow-sm text-center cursor-pointer hover:bg-white hover:border-orange-200 hover:shadow-md hover:scale-105 transition-all duration-200 group"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="p-2.5 bg-orange-100 text-orange-600 rounded-full mb-1 group-hover:bg-orange-200 transition-colors">
              <ImageIcon size={20} />
            </div>
            <span className="text-sm font-bold text-slate-700">Foto</span>
            <span className="text-[10px] sm:text-xs text-slate-500 leading-tight">
              Subí tu captura
            </span>
          </div>

        </div>
      )}

      {/* INPUT BUSCADOR */}
      {!result && !loading && (
        <div className="w-full max-w-xl z-10 mb-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-purple-600 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>

            <div className="relative bg-white rounded-lg p-2 shadow-xl flex items-center gap-2">

              {/* INPUT FILE OCULTO */}
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageUpload}
              />

              {/* CONTENIDO DEL INPUT: TEXTO O PREVIEW DE IMAGEN */}
              {selectedImage ? (
                <div className="flex-1 p-2 flex items-center justify-between bg-slate-100 rounded border border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 rounded overflow-hidden border border-slate-300">
                      <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                    <span className="text-sm font-medium text-slate-700">Imagen cargada</span>
                  </div>
                  <button onClick={clearImage} className="text-slate-400 hover:text-red-500 p-1">
                    <X size={20} />
                  </button>
                </div>
              ) : (
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Pegá el link, texto o subí foto..."
                  className="block w-full p-4 text-lg text-gray-900 placeholder-gray-500 bg-transparent border-none outline-none focus:ring-0"
                  onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
                />
              )}

              {/* BOTÓN CÁMARA (visible si no hay foto) */}
              {!selectedImage && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-slate-400 hover:text-primary transition-colors hover:bg-slate-50 rounded-full hidden sm:block"
                  title="Subir captura"
                >
                  <Camera size={24} />
                </button>
              )}

              {/* BOTÓN BUSCAR */}
              <button
                onClick={handleCheck}
                disabled={loading && !result}
                className="bg-primary hover:bg-primary/90 text-white p-4 rounded-md transition-all font-bold tracking-wide flex items-center gap-2"
              >
                <Search size={24} />
              </button>
            </div>

            {!selectedImage && (
              <p className="text-xs text-center mt-3 text-gray-400">
                Tip: Si es de Facebook/Insta y falla, sacale captura y subila 📸.
              </p>
            )}
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 animate-in slide-in-from-top-2 border border-red-200">
              <AlertTriangle size={20} />
              {error}
            </div>
          )}
        </div>
      )}

      {/* BOTONES DE DONACIÓN */}
      {!result && !loading && !selectedImage && (
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
            <DollarSign size={16} className="text-green-600" />
            Tirame un centro
          </a>
        </div>
      )}

      {/* TARJETA DE RESULTADO */}
      {result && userGuess && (
        <ResultCard data={result} userGuess={userGuess} onReset={resetState} />
      )}

      {/* MURO DE LA VERDAD */}
      {!result && !loading && (
        <RecentChecks onSelect={handleSelectFromHistory} />
      )}

    </div>
  );
}