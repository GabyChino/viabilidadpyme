"use client";
import { useInView } from "@/lib/useInView";
import { MapPin, Check, Landmark, ArrowRight } from "lucide-react";
import Link from "next/link";

// ── Mini visualizaciones ─────────────────────────────────────────────────────

// Posiciones (en %) de los competidores alrededor del negocio
const COMPETIDORES = [
  [22, 30], [70, 22], [80, 58], [30, 72], [58, 80], [15, 52], [64, 40],
];

function RadarCompetencia() {
  return (
    <div className="relative h-full w-full" aria-hidden="true">
      {/* Anillos que pulsan desde el centro */}
      {[0, 0.9, 1.8].map((retraso) => (
        <span
          key={retraso}
          className="absolute left-1/2 top-1/2 -ml-16 -mt-16 w-32 h-32 rounded-full border-2 border-brand-400/60 animar-pulso"
          style={{ animationDelay: `${retraso}s` }}
        />
      ))}
      <span className="absolute left-1/2 top-1/2 -ml-[4.5rem] -mt-[4.5rem] w-36 h-36 rounded-full border border-dashed border-brand-soft-border" />
      {COMPETIDORES.map(([x, y], i) => (
        <span
          key={i}
          className="absolute w-3 h-3 -ml-1.5 -mt-1.5 rounded-full bg-amber-400 ring-4 ring-amber-400/20 revelar"
          style={{ left: `${x}%`, top: `${y}%`, "--i": i + 3 } as React.CSSProperties}
        />
      ))}
      <span className="absolute left-1/2 top-1/2 -ml-4 -mt-7 animar-flotar-suave">
        <MapPin size={32} className="text-brand-600 fill-brand-200 dark:fill-brand-900" />
      </span>
    </div>
  );
}

function TramitesPalomeados() {
  const tramites = ["Aviso de funcionamiento", "Licencia municipal", "Uso de suelo"];
  return (
    <div className="h-full flex flex-col justify-center gap-2.5 px-6" aria-hidden="true">
      {tramites.map((t, i) => (
        <div key={t} className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-surface border border-border revelar" style={{ "--i": i + 2 } as React.CSSProperties}>
          <span className="w-5 h-5 rounded-full bg-brand-600 flex items-center justify-center shrink-0">
            <Check size={12} className="text-white" strokeWidth={3} />
          </span>
          <span className="text-xs font-medium text-content-2">{t}</span>
        </div>
      ))}
    </div>
  );
}

function FinanciamientoProximo() {
  return (
    <div className="h-full flex items-center justify-center" aria-hidden="true">
      <div className="relative">
        <div className="w-20 h-20 rounded-2xl bg-surface border border-border flex items-center justify-center animar-flotar-suave">
          <Landmark size={34} className="text-content-3" />
        </div>
        <span className="absolute -top-3 -right-10 text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
          Próximamente
        </span>
      </div>
    </div>
  );
}

// ── Sección ──────────────────────────────────────────────────────────────────

const MODULOS = [
  { Visual: RadarCompetencia, titulo: "Potencial comercial", texto: "Cuántos negocios de tu giro hay a menos de 800 m.", fuente: "DENUE · OpenStreetMap" },
  { Visual: TramitesPalomeados, titulo: "Tramitómetro", texto: "Los permisos que aplican a tu giro, con costo y plazo.", fuente: "RETyS Baja California" },
  { Visual: FinanciamientoProximo, titulo: "Beneficios y crédito", texto: "Programas de apoyo según tu giro y capital.", fuente: "NAFIN · Fondo PyME" },
];

export function ModulosSection() {
  const ref = useInView<HTMLDivElement>();

  return (
    <section id="modulos" className="py-20 px-4 sm:px-6 bg-surface-2 scroll-mt-16">
      <div ref={ref} className="max-w-5xl mx-auto">
        <div className="text-center revelar">
          <span className="text-sm font-semibold uppercase tracking-widest text-brand-strong">Qué incluye</span>
          <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-content">Todo en un solo diagnóstico</h2>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-5">
          {MODULOS.map(({ Visual, titulo, texto, fuente }, i) => (
            <article
              key={titulo}
              className="tarjeta-elevable flex flex-col rounded-2xl border border-border bg-surface overflow-hidden revelar"
              style={{ "--i": i + 1 } as React.CSSProperties}
            >
              <div className="h-44 bg-gradient-to-br from-brand-soft to-surface-2 border-b border-border">
                <Visual />
              </div>
              <div className="p-5 flex flex-col gap-1.5 flex-1">
                <h3 className="text-lg font-bold text-content">{titulo}</h3>
                <p className="text-sm text-content-2">{texto}</p>
                <p className="mt-auto pt-3 text-xs text-content-3">{fuente}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-10 text-center revelar" style={{ "--i": 5 } as React.CSSProperties}>
          <Link
            href="/analizar"
            className="group inline-flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl transition-all hover:-translate-y-0.5 shadow-md shadow-brand-600/20"
          >
            Probarlo con mi negocio
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
