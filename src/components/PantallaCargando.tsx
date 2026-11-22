"use client";

import { Loader2, Brain, Database, BarChart3, FileSearch } from "lucide-react";
import { cn } from "@/lib/utils";

const ETAPAS = [
  {
    icono: Brain,
    label: "Iniciando análisis",
    descripcion: "Procesando los datos de tu negocio",
    color: "text-brand-strong",
    bg: "bg-brand-soft",
  },
  {
    icono: FileSearch,
    label: "Consultando RETyS",
    descripcion: "Buscando trámites y permisos aplicables en Baja California",
    color: "text-green-600",
    bg: "bg-green-100",
  },
  {
    icono: Database,
    label: "Evaluando 10 criterios",
    descripcion: "Calculando puntaje de viabilidad (mercado, finanzas, regulación…)",
    color: "text-orange-600",
    bg: "bg-orange-100",
  },
  {
    icono: BarChart3,
    label: "Generando informe",
    descripcion: "Preparando resultados, fortalezas, riesgos y siguientes pasos",
    color: "text-purple-600",
    bg: "bg-purple-100",
  },
];

interface Props {
  etapaActual?: number;
}

export function PantallaCargando({ etapaActual = 0 }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-8 py-12">
      <div className="relative">
        <div className="w-20 h-20 rounded-full bg-brand-700/30 flex items-center justify-center">
          <Brain size={36} className="text-brand-strong" />
        </div>
        <div className="absolute inset-0 rounded-full border-4 border-brand-500 border-t-transparent animate-spin" />
      </div>

      <div className="text-center">
        <h3 className="text-lg font-semibold text-content">
          El agente IA está trabajando…
        </h3>
        <p className="text-sm text-content-3 mt-1">
          Analizando tu negocio
        </p>
      </div>

      <div className="w-full max-w-md space-y-3">
        {ETAPAS.map((etapa, idx) => {
          const completado = idx < etapaActual;
          const activo = idx === etapaActual;
          const Icono = etapa.icono;
          return (
            <div
              key={idx}
              className={cn(
                "flex items-center gap-4 p-3 rounded-xl border transition-all duration-500",
                completado && "border-border bg-surface opacity-50",
                activo && "border-brand-700 bg-brand-700/20 shadow-sm",
                !completado && !activo && "border-border bg-surface opacity-25"
              )}
            >
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", etapa.bg)}>
                {activo ? (
                  <Loader2 size={16} className={cn(etapa.color, "animate-spin")} />
                ) : (
                  <Icono size={16} className={completado ? "text-content-3" : etapa.color} />
                )}
              </div>
              <div className="min-w-0">
                <p className={cn("text-sm font-medium", activo ? "text-content" : "text-content-3")}>
                  {etapa.label}
                </p>
                {activo && (
                  <p className="text-xs text-content-3 truncate">{etapa.descripcion}</p>
                )}
              </div>
              {completado && (
                <span className="ml-auto text-xs text-green-600 font-medium shrink-0">✓</span>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-content-3">
        Proceso estimado: 30–60 segundos
      </p>
    </div>
  );
}
