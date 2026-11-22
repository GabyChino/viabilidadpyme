import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Analiza tu negocio",
  description:
    "Responde 5 pasos sobre tu negocio y obtén un diagnóstico de viabilidad con el modelo de 10 criterios y los trámites del RETyS de Baja California.",
};

export default function AnalizarLayout({ children }: { children: React.ReactNode }) {
  return children;
}
