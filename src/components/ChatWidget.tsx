"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle, X, Bot, RotateCcw, Sparkles, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Conversacion } from "@/components/chat/Conversacion";

const MENSAJE_BIENVENIDA =
  "¡Hola! Soy el **Asesor PYME Tijuana**. Puedo orientarte sobre:\n\n" +
  "• **Trámites y permisos** del RETyS de Baja California\n" +
  "• **Financiamiento** y apoyos para PYMES\n" +
  "• **Régimen fiscal**, IMSS y uso de suelo\n\n" +
  "Para un diagnóstico completo de tu idea de negocio, usa el análisis de viabilidad.";

const SUGERENCIAS = [
  "¿Qué trámites necesito para abrir una taquería?",
  "¿Qué es el SARE?",
  "¿Qué financiamiento hay en Tijuana?",
];

/**
 * Asistente flotante disponible en todo el sitio, excepto en /analizar
 * (esa página ya tiene su propio chat junto a los resultados).
 */
export function ChatWidget() {
  const pathname = usePathname();
  const [abierto, setAbierto] = useState(false);
  const [reinicios, setReinicios] = useState(0);

  if (pathname?.startsWith("/analizar")) return null;

  return (
    <div className="no-print">
      {/* Panel */}
      <div
        id="chat-widget-panel"
        role="dialog"
        aria-label="Asesor PYME Tijuana"
        inert={!abierto}
        className={cn(
          "fixed bottom-20 right-4 z-50 flex flex-col",
          "w-[380px] max-w-[calc(100vw-2rem)] h-[540px] max-h-[calc(100vh-6rem)]",
          "bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden",
          "transition-all duration-300 origin-bottom-right",
          abierto
            ? "scale-100 opacity-100 pointer-events-auto"
            : "scale-95 opacity-0 pointer-events-none"
        )}
      >
        {/* Encabezado */}
        <div className="flex items-center gap-3 px-4 py-3 bg-brand-700 shrink-0">
          <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center shrink-0" aria-hidden="true">
            <Bot size={16} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white leading-none truncate">Asesor PYME Tijuana</p>
            <p className="text-xs text-brand-100 mt-0.5">IBM watsonx Orchestrate · RETyS B.C.</p>
          </div>
          <button
            type="button"
            onClick={() => setReinicios((n) => n + 1)}
            className="text-brand-100 hover:text-white transition-colors p-1 rounded"
            aria-label="Reiniciar conversación"
            title="Reiniciar conversación"
          >
            <RotateCcw size={14} />
          </button>
          <button
            type="button"
            onClick={() => setAbierto(false)}
            className="text-brand-100 hover:text-white transition-colors p-1 rounded"
            aria-label="Cerrar asesor"
          >
            <X size={16} />
          </button>
        </div>

        {/* Acceso al diagnóstico completo */}
        <Link
          href="/analizar"
          onClick={() => setAbierto(false)}
          className="shrink-0 flex items-center gap-2 px-4 py-2.5 border-b border-border bg-brand-soft text-xs font-medium text-brand-strong hover:bg-surface-3 transition-colors"
        >
          <Sparkles size={13} />
          Analizar la viabilidad de mi negocio
          <ArrowRight size={13} className="ml-auto" />
        </Link>

        <Conversacion
          key={reinicios}
          mensajeInicial={MENSAJE_BIENVENIDA}
          sugerencias={SUGERENCIAS}
          compacto
        />
      </div>

      {/* Botón flotante */}
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className={cn(
          "fixed bottom-4 right-4 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300",
          abierto ? "bg-brand-700" : "bg-brand-600 hover:bg-brand-700 hover:scale-110"
        )}
        aria-label={abierto ? "Cerrar asesor" : "Abrir asesor PYME"}
        aria-expanded={abierto}
        aria-controls="chat-widget-panel"
      >
        {abierto ? <X size={22} className="text-white" /> : <MessageCircle size={22} className="text-white" />}
      </button>
    </div>
  );
}
