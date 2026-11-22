"use client";

import { useEffect, useRef, useState, type Ref } from "react";
import { Send, Loader2, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { TextoMarkdown } from "@/components/chat/TextoMarkdown";

type Fuente = "agente_watsonx" | "watsonx_ai" | "retys_engine";

interface Mensaje {
  rol: "user" | "agent";
  texto: string;
  fuente?: Fuente;
}

interface Props {
  mensajeInicial: string;
  sugerencias: string[];
  /** Resumen del análisis, enviado al agente para que responda sobre ese negocio */
  contexto?: string;
  compacto?: boolean;
  inputRef?: Ref<HTMLTextAreaElement>;
}

/**
 * Conversación con el asistente (mensajes, sugerencias y caja de texto).
 * La usan el chat de la página de análisis y el widget flotante.
 * Para reiniciarla, el padre cambia su `key`.
 */
export function Conversacion({ mensajeInicial, sugerencias, contexto, compacto = false, inputRef }: Props) {
  const [mensajes, setMensajes] = useState<Mensaje[]>([{ rol: "agent", texto: mensajeInicial }]);
  const [input, setInput] = useState("");
  const [cargando, setCargando] = useState(false);
  const listaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const lista = listaRef.current;
    if (lista) lista.scrollTo({ top: lista.scrollHeight, behavior: "smooth" });
  }, [mensajes, cargando]);

  const enviar = async (texto: string) => {
    const msg = texto.trim();
    if (!msg || cargando) return;

    // El mensaje de bienvenida no se envía como historial
    const historial = mensajes.slice(1).map(({ rol, texto }) => ({ rol, texto }));

    setInput("");
    setMensajes((prev) => [...prev, { rol: "user", texto: msg }]);
    setCargando(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, history: historial, contexto }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Error al procesar tu pregunta.");
      setMensajes((prev) => [...prev, { rol: "agent", texto: data.reply, fuente: data.source }]);
    } catch (e) {
      const detalle = e instanceof Error ? e.message : "Error al procesar tu pregunta.";
      setMensajes((prev) => [...prev, { rol: "agent", texto: `⚠️ ${detalle} Intenta de nuevo.` }]);
    } finally {
      setCargando(false);
    }
  };

  const textoTam = compacto ? "text-xs" : "text-sm";

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Mensajes */}
      <div
        ref={listaRef}
        className={cn("flex-1 overflow-y-auto bg-surface-2 min-h-0", compacto ? "p-3 space-y-3" : "p-4 space-y-4")}
        role="log"
        aria-live="polite"
        aria-label="Conversación con el asistente"
      >
        {mensajes.map((m, i) => (
          <div key={i} className={cn("flex gap-2", m.rol === "user" ? "justify-end" : "justify-start")}>
            {m.rol === "agent" && (
              <div className="w-7 h-7 rounded-full bg-brand-700 flex items-center justify-center shrink-0 mt-0.5" aria-hidden="true">
                <Bot size={13} className="text-white" />
              </div>
            )}
            <div className="max-w-[85%] min-w-0">
              <div
                className={cn(
                  "px-3 py-2 rounded-2xl leading-relaxed",
                  textoTam,
                  m.rol === "user"
                    ? "bg-brand-600 text-white rounded-br-sm"
                    : "bg-surface border border-border text-content rounded-bl-sm"
                )}
              >
                {m.rol === "agent" ? <TextoMarkdown texto={m.texto} /> : m.texto}
              </div>
              {m.fuente === "retys_engine" && (
                <p className="text-[10px] text-content-3 mt-1 ml-1">
                  Respuesta del asistente básico (el agente IA no estuvo disponible)
                </p>
              )}
            </div>
          </div>
        ))}

        {cargando && (
          <div className="flex gap-2 justify-start" aria-label="El asistente está escribiendo">
            <div className="w-7 h-7 rounded-full bg-brand-700 flex items-center justify-center shrink-0" aria-hidden="true">
              <Bot size={13} className="text-white" />
            </div>
            <div className="bg-surface border border-border px-3 py-2 rounded-2xl rounded-bl-sm">
              <Loader2 size={14} className="text-content-3 animate-spin" />
            </div>
          </div>
        )}
      </div>

      {/* Sugerencias */}
      {mensajes.length <= 2 && !cargando && sugerencias.length > 0 && (
        <div className="shrink-0 px-3 py-2 flex gap-1.5 flex-wrap border-t border-border bg-surface">
          {sugerencias.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => enviar(s)}
              className="px-2.5 py-1 text-xs border border-border rounded-full text-content-2 hover:text-content hover:border-brand-500 hover:bg-surface-2 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Caja de texto */}
      <div className="shrink-0 px-3 py-2.5 border-t border-border bg-surface">
        <form
          onSubmit={(e) => { e.preventDefault(); enviar(input); }}
          className="flex gap-2 items-end bg-surface-2 border border-border rounded-xl px-3 py-1.5 focus-within:border-brand-500 transition-colors"
        >
          <label htmlFor={compacto ? "chat-input-widget" : "chat-input"} className="sr-only">
            Escribe tu pregunta
          </label>
          <textarea
            id={compacto ? "chat-input-widget" : "chat-input"}
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                enviar(input);
              }
            }}
            maxLength={1000}
            placeholder="Escribe tu pregunta…"
            rows={1}
            className={cn("flex-1 resize-none bg-transparent text-content placeholder:text-content-3 focus:outline-none max-h-24 overflow-y-auto min-h-6", textoTam)}
          />
          <button
            type="submit"
            disabled={!input.trim() || cargando}
            aria-label="Enviar mensaje"
            className="shrink-0 w-8 h-8 flex items-center justify-center bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <Send size={13} />
          </button>
        </form>
        <p className="text-center text-[10px] text-content-3 mt-1.5">
          Las respuestas de la IA pueden contener errores. Confirma los trámites con la dependencia.
        </p>
      </div>
    </div>
  );
}
