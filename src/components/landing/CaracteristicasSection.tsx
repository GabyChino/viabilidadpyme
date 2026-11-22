"use client";
import { useInView } from "@/lib/useInView";
import {
  Zap, MapPin, TrendingUp, FileText, Shield, RefreshCw,
  Brain, AlertTriangle, Download,
} from "lucide-react";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    icono: Brain,
    color: "bg-brand-soft text-brand-strong",
    border: "border-border",
    titulo: "Agente IA con razonamiento",
    descripcion:
      "Nuestro agente de inteligencia artificial no solo recopila datos, razona sobre ellos y explica por qué un negocio es o no viable.",
  },
  {
    icono: MapPin,
    color: "bg-emerald-100 text-emerald-700",
    border: "border-border",
    titulo: "Análisis geográfico preciso",
    descripcion:
      "Evaluación hasta nivel colonia con datos de densidad de competencia, nivel socioeconómico y unidades económicas del INEGI.",
  },
  {
    icono: TrendingUp,
    color: "bg-purple-100 text-purple-700",
    border: "border-border",
    titulo: "Tendencias de mercado",
    descripcion:
      "Datos abiertos integrados para detectar estacionalidad y crecimiento de demanda en el giro comercial seleccionado.",
  },
  {
    icono: FileText,
    color: "bg-amber-100 text-amber-700",
    border: "border-border",
    titulo: "Trámites y regulaciones",
    descripcion:
      "Consulta automática a RETYS: licencias, permisos, costos y tiempos de apertura específicos para tu estado y giro.",
  },
  {
    icono: AlertTriangle,
    color: "bg-red-100 text-red-700",
    border: "border-border",
    titulo: "Detección de riesgos",
    descripcion:
      "El agente identifica alertas automáticas: capital insuficiente, zona saturada, carga regulatoria alta o nómina excesiva.",
  },
  {
    icono: Zap,
    color: "bg-indigo-100 text-indigo-700",
    border: "border-border",
    titulo: "Resultados en 60 segundos",
    descripcion:
      "Las consultas a múltiples APIs se ejecutan en paralelo para entregarte un análisis completo en menos de un minuto.",
  },
  {
    icono: Shield,
    color: "bg-teal-100 text-teal-700",
    border: "border-border",
    titulo: "Fuentes oficiales verificadas",
    descripcion:
      "Todos los datos provienen de instituciones oficiales: INEGI, COFEMER/RETYS y plataformas de datos abiertos verificadas.",
  },
  {
    icono: Download,
    color: "bg-orange-100 text-orange-700",
    border: "border-border",
    titulo: "Exportación de reportes",
    descripcion:
      "Descarga tu análisis en PDF o Excel con el reporte ejecutivo completo, gráficas de Power BI y plan de acción.",
  },
  {
    icono: RefreshCw,
    color: "bg-pink-100 text-pink-700",
    border: "border-border",
    titulo: "Múltiples escenarios",
    descripcion:
      "Guarda y compara análisis con distintos capitales, ubicaciones o modelos de negocio para tomar la mejor decisión.",
  },
];

export function CaracteristicasSection() {
  const headerRef = useInView<HTMLDivElement>();

  return (
    <section id="caracteristicas" className="py-20 px-4 sm:px-6 bg-surface">
      <div className="max-w-6xl mx-auto">
        <div ref={headerRef} className="anim-hidden text-center max-w-2xl mx-auto mb-14">
          <span className="text-sm font-semibold uppercase tracking-widest text-brand-strong">
            Funcionalidades
          </span>
          <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-content">
            Todo lo que necesitas para decidir con certeza
          </h2>
          <p className="mt-4 text-content-2 text-lg">
            Una herramienta diseñada para emprendedores, consultores e incubadoras
            que necesitan datos reales antes de invertir.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => {
            const Icono = f.icono;
            const delay = i < 6 ? `anim-delay-${i + 1}` : "";
            return (
              <div
                key={i}
                className={cn(
                  "flex flex-col gap-3 p-5 rounded-2xl border bg-surface-2 transition-all hover:border-brand-400",
                  f.border,
                  delay
                )}
              >
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", f.color)}>
                  <Icono size={20} />
                </div>
                <h3 className="text-base font-semibold text-content">{f.titulo}</h3>
                <p className="text-sm text-content-2 leading-relaxed">{f.descripcion}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
