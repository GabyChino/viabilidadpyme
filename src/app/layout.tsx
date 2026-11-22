import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ChatWidget } from "@/components/ChatWidget";

// Fuente variable: incluye todos los pesos (400–700) que usan los componentes
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: {
    default: "Viabilidad PYME – Diagnóstico para tu negocio en Tijuana",
    template: "%s · Viabilidad PYME Tijuana",
  },
  description:
    "Analiza la viabilidad de tu PYME en Tijuana: modelo de 10 criterios, trámites del RETyS de Baja California y competencia cercana. Gratis para emprendedores y negocios en operación.",
  openGraph: {
    title: "Viabilidad PYME – Diagnóstico para tu negocio en Tijuana",
    description:
      "Diagnóstico gratuito de viabilidad con IA: modelo de 10 criterios, trámites del RETyS de Baja California y competencia cercana.",
    locale: "es_MX",
    type: "website",
  },
};

// Color de la barra del navegador en móvil (igual al fondo de cada tema)
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f7f2" },
    { media: "(prefers-color-scheme: dark)", color: "#0e130f" },
  ],
};

// Script: evitar flash de tema antes del primer render. Sin preferencia
// guardada, sigue la configuración del sistema operativo.
const themeScript = `
  (function() {
    try {
      var t = localStorage.getItem('theme');
      if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.setAttribute('data-theme', 'dark');
      }
    } catch(e) {}
  })();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="font-sans">
        {children}
        {/* Asistente flotante (se oculta en /analizar, que tiene su propio chat) */}
        <ChatWidget />
      </body>
    </html>
  );
}
