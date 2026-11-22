"use client";
import { useInView } from "@/lib/useInView";
import { FileCheck, Target, MapPin, Timer } from "lucide-react";
import { Contador } from "@/components/landing/efectos";

// Cifras de la propia plataforma, verificables. Las estadísticas de negocios de
// Tijuana se pueden calcular con el DENUE: npm run denue:estadisticas
const CIFRAS = [
  { Icono: FileCheck, valor: 242, sufijo: "", etiqueta: "fichas oficiales del RETyS" },
  { Icono: Target, valor: 10, sufijo: "", etiqueta: "criterios de evaluación" },
  { Icono: MapPin, valor: 800, sufijo: " m", etiqueta: "radio de competencia" },
  { Icono: Timer, valor: 60, sufijo: " s", prefijo: "<", etiqueta: "para tu diagnóstico" },
];

export function ContextoSection() {
  const ref = useInView<HTMLDivElement>();

  return (
    <section className="py-16 px-4 sm:px-6 bg-brand-soft border-y border-brand-soft-border">
      <div ref={ref} className="max-w-5xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8">
        {CIFRAS.map(({ Icono, valor, sufijo, prefijo, etiqueta }, i) => (
          <div key={etiqueta} className="text-center revelar" style={{ "--i": i } as React.CSSProperties}>
            <div className="mx-auto mb-3 w-11 h-11 rounded-xl bg-surface flex items-center justify-center shadow-sm" aria-hidden="true">
              <Icono size={20} className="text-brand-strong" />
            </div>
            <p className="text-4xl sm:text-5xl font-bold text-content tracking-tight">
              <Contador hasta={valor} prefijo={prefijo} sufijo={sufijo} />
            </p>
            <p className="mt-1 text-sm text-content-2">{etiqueta}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
