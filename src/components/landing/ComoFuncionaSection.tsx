"use client";
import { useInView } from "@/lib/useInView";
import { UserRound, MapPin, Sparkles, ClipboardCheck } from "lucide-react";

const PASOS = [
  { Icono: UserRound, titulo: "Elige tu perfil", texto: "Emprendedor o negocio en operación" },
  { Icono: MapPin, titulo: "Busca tu negocio", texto: "O captura tus datos a mano" },
  { Icono: Sparkles, titulo: "Se llena solo", texto: "La IA investiga y completa el formulario" },
  { Icono: ClipboardCheck, titulo: "Recibe tu diagnóstico", texto: "Puntaje, trámites, competencia y riesgos" },
];

export function ComoFuncionaSection() {
  const ref = useInView<HTMLDivElement>();

  return (
    <section id="como-funciona" className="py-20 px-4 sm:px-6 bg-surface scroll-mt-16">
      <div ref={ref} className="max-w-5xl mx-auto">
        <div className="text-center revelar">
          <span className="text-sm font-semibold uppercase tracking-widest text-brand-strong">Cómo funciona</span>
          <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-content">Cuatro pasos, menos de un minuto</h2>
        </div>

        <ol className="relative mt-14 grid grid-cols-1 lg:grid-cols-4 gap-10 lg:gap-6">
          {/* Línea que une los pasos: horizontal en escritorio, vertical en móvil */}
          <div className="hidden lg:block absolute top-8 left-[12.5%] right-[12.5%] h-0.5 bg-border" aria-hidden="true">
            <div className="h-full bg-brand-500 linea-progreso" />
          </div>
          <div className="lg:hidden absolute top-8 bottom-8 left-8 w-0.5 bg-border" aria-hidden="true">
            <div className="w-full h-full bg-brand-500 linea-progreso-v" />
          </div>

          {PASOS.map(({ Icono, titulo, texto }, i) => (
            <li
              key={titulo}
              className="relative flex lg:flex-col items-center lg:text-center gap-5 lg:gap-4 revelar"
              style={{ "--i": i + 2 } as React.CSSProperties}
            >
              <div className="group relative w-16 h-16 shrink-0 rounded-2xl bg-surface border-2 border-brand-soft-border flex items-center justify-center shadow-sm transition-transform hover:scale-110 hover:rotate-3">
                <Icono size={26} className="text-brand-strong" aria-hidden="true" />
                <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
              </div>
              <div>
                <p className="text-base font-semibold text-content">{titulo}</p>
                <p className="text-sm text-content-3 mt-1">{texto}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
