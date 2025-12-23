import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import Image from "next/image";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL('https://sarasa-checker.vercel.app'),
  title: "Sarasa Checker | El avivador de giles",
  description: "🛑 ¡Pará la mano! Antes de compartir esa cadena en el grupo, fijate si es humo o si es posta. Chequealo con IA.",
  keywords: ["fake news", "argentina", "ia", "fact check", "verificador", "sarasa", "milei", "politica"],
  authors: [{ name: "Sarasa Team" }],
  openGraph: {
    title: "Sarasa Checker | El avivador de giles",
    description: "🕵️‍♂️ Detectá versos y noticias falsas al toque. No te comas el amague.",
    url: "https://sarasa-checker.vercel.app",
    siteName: "Sarasa Checker",
    locale: "es_AR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.className} min-h-screen flex flex-col bg-background text-foreground`}>

        <main className="flex-grow flex flex-col w-full">
          {children}
        </main>

        <Toaster position="bottom-center" richColors />

        {/* FOOTER GLOBAL */}
        <footer className="py-6 text-center text-sm text-muted-foreground border-t border-border/40 bg-slate-50/80 backdrop-blur-sm mt-auto w-full">
          <div className="container mx-auto px-4 flex flex-col items-center gap-4">

            {/* BLOQUE DE AUTORÍA */}
            <div className="flex items-center justify-center gap-3 animate-fade-in-up">
              <span className="text-slate-500 font-medium text-xs uppercase tracking-wider">
                Una artesanía digital de
              </span>

              {/* ACÁ ESTÁ EL CAMBIO: AHORA ES UN LINK */}
              <a
                href="https://www.instagram.com/artesaniasdigitales_" // <--- ¡CAMBIÁ ESTO POR TU LINK!
                target="_blank"
                rel="noopener noreferrer"
                className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-slate-200 shadow-sm hover:scale-110 transition-transform cursor-pointer filter hover:brightness-110"
                title="Visitar Instagram"
              >
                <Image
                  src="/logo-ad.png"
                  alt="Artesanías Digitales"
                  fill
                  className="object-cover"
                />
              </a>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-slate-400">
                Hecho con 🧉 y potenciado por <strong>Gemini</strong> + <strong>Groq</strong>.
              </p>
              <p className="text-[10px] text-slate-300 max-w-md mx-auto leading-tight">
                *Sarasa Checker usa IA experimental.
              </p>
            </div>

          </div>
        </footer>

      </body>
    </html>
  );
}