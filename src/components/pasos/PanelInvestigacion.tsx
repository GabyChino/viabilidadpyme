"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, Sparkles, AlertCircle, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InvestigacionNegocio } from "@/lib/types";

export const PISTA_AUTOLLENADO = "Llenado automáticamente con datos públicos de tu negocio; revísalo y ajústalo si hace falta.";

export type EstadoInvestigacion =
  | { fase: "investigando"; tieneSitioWeb: boolean; fuente: "osm" | "denue" }
  | { fase: "lista"; resultado: InvestigacionNegocio; camposLlenados: number }
  | { fase: "error"; mensaje: string };

/** Pasos que se muestran mientras se investiga (avanzan con el tiempo, no con el servidor). */
function PasosInvestigacion({ tieneSitioWeb, fuente }: { tieneSitioWeb: boolean; fuente: "osm" | "denue" }) {
  const pasos = [
    fuente === "denue" ? "Consultando su registro en el DENUE de INEGI" : "Consultando su ficha en OpenStreetMap",
    ...(tieneSitioWeb ? ["Revisando su sitio web"] : []),
    "Redactando la descripción con IA",
  ];
  const [actual, setActual] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setActual((a) => Math.min(a + 1, pasos.length - 1)), 1800);
    return () => clearInterval(id);
  }, [pasos.length]);

  return (
    <ul className="flex flex-col gap-2 mt-3">
      {pasos.map((paso, i) => (
        <li
          key={paso}
          className={cn(
            "flex items-center gap-2 text-xs transition-colors",
            i < actual ? "text-content-2" : i === actual ? "text-content font-medium" : "text-content-3"
          )}
        >
          {i < actual ? (
            <Check size={13} className="text-brand-strong" aria-hidden="true" />
          ) : i === actual ? (
            <Loader2 size={13} className="animate-spin text-brand-strong" aria-hidden="true" />
          ) : (
            <span className="w-[13px] h-[13px] rounded-full border border-border" aria-hidden="true" />
          )}
          {paso}
        </li>
      ))}
    </ul>
  );
}

export function PanelInvestigacion({ estado }: { estado: EstadoInvestigacion }) {
  if (estado.fase === "investigando") {
    return (
      <div className="rounded-xl border border-border bg-surface-2 p-4" role="status" aria-live="polite">
        <p className="flex items-center gap-2 text-sm font-semibold text-content">
          <Sparkles size={15} className="text-brand-strong" aria-hidden="true" />
          Investigando tu negocio para llenar el formulario…
        </p>
        <PasosInvestigacion tieneSitioWeb={estado.tieneSitioWeb} fuente={estado.fuente} />
      </div>
    );
  }

  if (estado.fase === "error") {
    return (
      <div className="flex items-start gap-2 rounded-xl border border-border bg-surface-2 p-4 text-sm text-content-2" role="status">
        <AlertCircle size={15} className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" aria-hidden="true" />
        <span>{estado.mensaje} Completa la descripción y el modelo de negocio a mano.</span>
      </div>
    );
  }

  const { resultado, camposLlenados } = estado;
  return (
    <div className="rounded-xl border border-border bg-surface-2 p-4" role="status" aria-live="polite">
      <p className="flex items-center gap-2 text-sm font-semibold text-content">
        <Check size={15} className="text-brand-strong" aria-hidden="true" />
        {camposLlenados > 0
          ? `Listo: llenamos ${camposLlenados} ${camposLlenados === 1 ? "campo" : "campos"} por ti`
          : "Revisamos tu negocio; no encontramos datos nuevos para llenar"}
      </p>
      {resultado.hallazgos.length > 0 && (
        <ul className="flex flex-wrap gap-1.5 mt-3">
          {resultado.hallazgos.map((h) => (
            <li key={h} className="text-xs px-2 py-1 rounded-md bg-surface border border-border text-content-2">
              {h}
            </li>
          ))}
        </ul>
      )}
      <p className="text-[11px] text-content-3 mt-3">
        {resultado.generadoPorIA ? "Descripción redactada con IA a partir de: " : "Fuentes: "}
        {resultado.fuentes.map((f, i) => (
          <span key={f.url}>
            {i > 0 && ", "}
            <a href={f.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 underline">
              {f.nombre} <ExternalLink size={10} aria-hidden="true" />
            </a>
          </span>
        ))}
        . Los datos financieros y de operación solo los conoces tú: los pediremos en los siguientes pasos.
      </p>
    </div>
  );
}
