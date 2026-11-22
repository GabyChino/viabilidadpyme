"use client";
import { useInView } from "@/lib/useInView";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const TESTIMONIOS = [
  {
    nombre: "Doña Carmen Ríos",
    negocio: "Taquería El Buen Sabroso · La Mesa, Tijuana",
    avatar: "CR",
    color: "bg-red-100 text-red-700",
    texto:
      "Llevaba 9 años en la informalidad aquí en La Mesa. Siempre le tuve miedo a los trámites. Con el Tramitómetro vi que el RESICO es solo el 1% de mis ventas y que puedo sacar mi licencia del Ayuntamiento de Tijuana en línea. Ya tengo mi RFC.",
  },
  {
    nombre: "Don Sergio Ibarra",
    negocio: "Taller mecánico · Sánchez Taboada, Tijuana",
    avatar: "SI",
    color: "bg-brand-soft text-brand-strong",
    texto:
      "Me extorsionaron dos veces en Sánchez Taboada. La herramienta me mostró que hay cámaras del C5 de Baja California a una cuadra que nunca supe cómo reportar. También contraté un seguro de $420 pesos al mes que cubre hasta $250,000.",
  },
  {
    nombre: "Valeria Mendoza",
    negocio: "Estética Valeria · Zona Río, Tijuana",
    avatar: "VM",
    color: "bg-purple-100 text-purple-700",
    texto:
      "Quería abrir en la Zona Río pero no sabía si me convenía. El DENUE me mostró 11 estéticas en menos de 1km. Abrí en Otay con solo 3 competidoras. A los 6 meses ya recuperé la inversión. Sin esta herramienta habría cometido el error.",
  },
];

export function TestimoniosSection() {
  const headerRef = useInView<HTMLDivElement>();
  const gridRef   = useInView<HTMLDivElement>();

  return (
    <section className="py-20 px-4 sm:px-6 bg-surface-2">
      <div className="max-w-6xl mx-auto">
        <div ref={headerRef} className="anim-hidden text-center max-w-2xl mx-auto mb-12">
          <span className="text-sm font-semibold uppercase tracking-widest text-brand-strong">
            Casos de uso
          </span>
          <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-content">
            Decisiones respaldadas por datos
          </h2>
          <p className="mt-4 text-content-2 text-lg">
            Comerciantes de Tijuana que utilizaron el diagnóstico para tomar
            decisiones de apertura, reubicación y formalización.
          </p>
        </div>

        <div ref={gridRef} className="anim-hidden grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {TESTIMONIOS.map((t, i) => (
            <div
              key={i}
              className={`anim-delay-${i + 1} bg-surface rounded-2xl border border-border p-6 flex flex-col gap-4 hover:border-brand-400 transition-all`}
            >
              <p className="text-base text-content-2 leading-relaxed italic">
                &ldquo;{t.texto}&rdquo;
              </p>
              <div className="flex items-center gap-3 mt-auto pt-4 border-t border-border">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${t.color}`}>
                  {t.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-content">{t.nombre}</p>
                  <p className="text-xs text-content-3">{t.negocio}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA secundario */}
        <div className="text-center">
          <Link
            href="/analizar"
            className="inline-flex items-center gap-2 px-7 py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl transition-all text-sm"
          >
            Iniciar diagnóstico
            <ArrowRight size={16} />
          </Link>
          <p className="text-xs text-content-3 mt-3">Sin registro · Sin costo · Resultados en menos de 60 segundos</p>
        </div>
      </div>
    </section>
  );
}
