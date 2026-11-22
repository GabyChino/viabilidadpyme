"use client";
import { useInView } from "@/lib/useInView";
import { Rocket, Store, Users, Building2 } from "lucide-react";

const PERFILES = [
  { Icono: Rocket, titulo: "Emprendedores", texto: "Valida tu idea antes de invertir" },
  { Icono: Store, titulo: "Negocios en operación", texto: "Descubre qué trámites te faltan" },
  { Icono: Users, titulo: "Consultores e incubadoras", texto: "Mismos criterios para cada proyecto" },
  { Icono: Building2, titulo: "Instituciones PYME", texto: "Un diagnóstico gratis para tus comerciantes" },
];

export function ParaQuienSection() {
  const ref = useInView<HTMLDivElement>();

  return (
    <section id="para-quien" className="py-20 px-4 sm:px-6 bg-surface scroll-mt-16">
      <div ref={ref} className="max-w-5xl mx-auto">
        <div className="text-center revelar">
          <span className="text-sm font-semibold uppercase tracking-widest text-brand-strong">¿Para quién es?</span>
          <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-content">Para quien abre y para quien ya opera</h2>
        </div>

        <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {PERFILES.map(({ Icono, titulo, texto }, i) => (
            <div
              key={titulo}
              className="group tarjeta-elevable rounded-2xl border border-border bg-surface-2 p-4 sm:p-6 text-center revelar hover:border-brand-500"
              style={{ "--i": i + 1 } as React.CSSProperties}
            >
              <div className="mx-auto w-14 h-14 rounded-2xl bg-brand-soft flex items-center justify-center transition-all duration-300 group-hover:bg-brand-600 group-hover:scale-110" aria-hidden="true">
                <Icono size={26} className="text-brand-strong transition-colors group-hover:text-white" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-content">{titulo}</h3>
              <p className="mt-1 text-sm text-content-3">{texto}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
