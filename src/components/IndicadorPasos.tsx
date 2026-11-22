"use client";

import { cn } from "@/lib/utils";
import type { PasoFormulario } from "@/lib/types";
import { Check } from "lucide-react";

interface Props {
  pasoActual: number;
  pasos: PasoFormulario[];
}

export function IndicadorPasos({ pasoActual, pasos }: Props) {
  return (
    <div className="w-full">
      {/* Desktop */}
      <div className="hidden md:flex items-center justify-between relative">
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-border z-0" />
        <div
          className="absolute top-5 left-0 h-0.5 bg-brand-600 z-0 transition-all duration-500"
          style={{
            width: `${((pasoActual - 1) / (pasos.length - 1)) * 100}%`,
          }}
        />
        {pasos.map((paso) => {
          const completado = pasoActual > paso.id;
          const activo = pasoActual === paso.id;
          return (
            <div key={paso.id} className="flex flex-col items-center z-10">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all duration-300",
                  completado && "bg-brand-600 border-brand-600 text-white",
                  activo && "bg-surface border-brand-500 text-brand-strong shadow-md shadow-brand-900/20",
                  !completado && !activo && "bg-surface border-border text-content-3"
                )}
              >
                {completado ? <Check size={16} /> : paso.id}
              </div>
              <div className="mt-2 text-center">
                <p
                  className={cn(
                    "text-xs font-medium",
                    activo ? "text-brand-strong" : completado ? "text-content-2" : "text-content-3"
                  )}
                >
                  {paso.titulo}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile */}
      <div className="flex md:hidden items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white text-sm font-bold">
            {pasoActual}
          </div>
          <div>
            <p className="text-sm font-semibold text-content">
              {pasos[pasoActual - 1]?.titulo}
            </p>
            <p className="text-xs text-content-3">
              {pasos[pasoActual - 1]?.descripcion}
            </p>
          </div>
        </div>
        <span className="text-xs text-content-3">
          Paso {pasoActual} de {pasos.length}
        </span>
      </div>

      {/* Barra de progreso mobile */}
      <div className="mt-3 md:hidden h-1.5 bg-border rounded-full overflow-hidden">
        <div
          className="h-full bg-brand-600 rounded-full transition-all duration-500"
          style={{
            width: `${(pasoActual / pasos.length) * 100}%`,
          }}
        />
      </div>
    </div>
  );
}
