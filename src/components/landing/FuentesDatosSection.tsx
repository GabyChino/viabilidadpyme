"use client";
import { useInView } from "@/lib/useInView";
import { BarChart2, Map, ClipboardList, Landmark, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";

function fuentes(denueActivo: boolean) {
  return [
    { Icono: ClipboardList, nombre: "RETyS Baja California", uso: "Trámites, costos y plazos", activo: true },
    { Icono: Map, nombre: "OpenStreetMap", uso: "Tu negocio y la competencia", activo: true },
    { Icono: BarChart2, nombre: "INEGI · DENUE", uso: "Directorio oficial de negocios", activo: denueActivo },
    { Icono: Cpu, nombre: "IBM watsonx", uso: "El asesor IA que analiza", activo: true },
    { Icono: Landmark, nombre: "NAFIN · Fondo PyME", uso: "Financiamiento", activo: false },
  ];
}

/** `denueActivo`: el servidor tiene INEGI_DENUE_TOKEN configurado */
export function FuentesDatosSection({ denueActivo }: { denueActivo: boolean }) {
  const ref = useInView<HTMLDivElement>();

  return (
    <section id="fuentes" className="py-20 px-4 sm:px-6 bg-surface-2 scroll-mt-16">
      <div ref={ref} className="max-w-5xl mx-auto">
        <div className="text-center revelar">
          <span className="text-sm font-semibold uppercase tracking-widest text-brand-strong">De dónde vienen los datos</span>
          <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-content">Fuentes oficiales y abiertas</h2>
        </div>

        <ul className="mt-12 grid grid-cols-2 lg:grid-cols-5 gap-4">
          {fuentes(denueActivo).map(({ Icono, nombre, uso, activo }, i) => (
            <li
              key={nombre}
              className={cn(
                "tarjeta-elevable rounded-2xl border bg-surface p-5 flex flex-col items-center text-center revelar",
                activo ? "border-border" : "border-dashed border-border opacity-75",
                i === 4 && "col-span-2 lg:col-span-1"
              )}
              style={{ "--i": i + 1 } as React.CSSProperties}
            >
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", activo ? "bg-brand-soft" : "bg-surface-3")} aria-hidden="true">
                <Icono size={22} className={activo ? "text-brand-strong" : "text-content-3"} />
              </div>
              <p className="mt-3 text-sm font-semibold text-content">{nombre}</p>
              <p className="mt-0.5 text-xs text-content-3">{uso}</p>
              <span
                className={cn(
                  "mt-3 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full",
                  activo ? "bg-brand-soft text-brand-strong" : "bg-surface-3 text-content-3"
                )}
              >
                <span className={cn("w-1.5 h-1.5 rounded-full", activo ? "bg-brand-500" : "bg-content-3")} />
                {activo ? "Activo" : "Próximamente"}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
