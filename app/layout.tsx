import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sarasa Checker | El avivador de giles",
  description: "Detectá fake news, versos y humo con Inteligencia Artificial. Antes de compartir en el grupo de la familia, chequealo acá.",
  keywords: ["fake news", "argentina", "ia", "fact check", "verificador", "sarasa"],
  authors: [{ name: "Sarasa Team" }],
  openGraph: {
    title: "Sarasa Checker | El avivador de giles",
    description: "🐢 ¿Te están caminando? Sacate la duda con IA.",
    url: "https://sarasa-checker.vercel.app", // Esto lo cambiamos cuando tengas el link real
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