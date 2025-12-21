import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  // IMPORTANTE: Esto arregla que no encuentre la imagen en Vercel
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
  twitter: {
    card: "summary_large_image",
    title: "Sarasa Checker",
    description: "¿Posta o Verso? Averigualo ahora.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>{children}</body>
    </html>
  );
}