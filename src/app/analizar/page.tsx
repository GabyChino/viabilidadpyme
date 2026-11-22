"use client";

import { useState, useEffect, useRef, useSyncExternalStore } from "react";
import Link from "next/link";
import { FormularioData, ResultadoAnalisis, EstadoAnalisis } from "@/lib/types";
import { FormularioViabilidad } from "@/components/FormularioViabilidad";
import { PantallaCargando } from "@/components/PantallaCargando";
import { PanelResultados } from "@/components/PanelResultados";
import { ChatAnalisis } from "@/components/ChatAnalisis";
import { BarChart3, ArrowLeft, History, X } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

// ── Último análisis guardado en el navegador ─────────────────────────────────

const CLAVE_GUARDADO = "pyme-viabilidad:ultimo-analisis";
const EVENTO_GUARDADO = "pyme-viabilidad:guardado";

interface AnalisisGuardado {
  datos: FormularioData;
  resultado: ResultadoAnalisis;
  fecha: string;
}

function leerGuardadoRaw(): string | null {
  try {
    return localStorage.getItem(CLAVE_GUARDADO);
  } catch {
    return null;
  }
}

function suscribirGuardado(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(EVENTO_GUARDADO, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(EVENTO_GUARDADO, callback);
  };
}

function escribirGuardado(valor: AnalisisGuardado | null) {
  try {
    if (valor) localStorage.setItem(CLAVE_GUARDADO, JSON.stringify(valor));
    else localStorage.removeItem(CLAVE_GUARDADO);
    window.dispatchEvent(new Event(EVENTO_GUARDADO));
  } catch {
    // Sin almacenamiento disponible (modo privado, etc.): no se guarda
  }
}

function parsearGuardado(raw: string | null): AnalisisGuardado | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as AnalisisGuardado;
    return v?.datos && v?.resultado ? v : null;
  } catch {
    return null;
  }
}

export default function AnalizarPage() {
  const [estadoAnalisis, setEstadoAnalisis] = useState<EstadoAnalisis>("idle");
  const [resultado, setResultado] = useState<ResultadoAnalisis | null>(null);
  const [datosFormulario, setDatosFormulario] = useState<FormularioData | null>(null);
  const [mensajeError, setMensajeError] = useState("");
  const [etapaCarga, setEtapaCarga] = useState(0);
  const etapaRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);

  const guardadoRaw = useSyncExternalStore(suscribirGuardado, leerGuardadoRaw, () => null);
  const guardado = parsearGuardado(guardadoRaw);

  const avanzarEtapas = () => {
    setEtapaCarga(0);
    etapaRef.current = setInterval(() => {
      setEtapaCarga((prev) => {
        if (prev >= 3) { clearInterval(etapaRef.current!); return prev; }
        return prev + 1;
      });
    }, 800);
  };

  useEffect(() => {
    return () => { if (etapaRef.current) clearInterval(etapaRef.current); };
  }, []);

  const handleSubmit = async (data: FormularioData) => {
    setDatosFormulario(data);
    setEstadoAnalisis("cargando");
    setMensajeError("");
    avanzarEtapas();
    try {
      const response = await fetch("/api/analizar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const cuerpo = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(cuerpo.error ?? "Error en el servidor");
      const resultadoApi = cuerpo as ResultadoAnalisis;
      setResultado(resultadoApi);
      setEstadoAnalisis("completado");
      escribirGuardado({ datos: data, resultado: resultadoApi, fecha: new Date().toISOString() });
    } catch (e) {
      setMensajeError(e instanceof Error ? e.message : "");
      setEstadoAnalisis("error");
    } finally {
      if (etapaRef.current) clearInterval(etapaRef.current);
    }
  };

  const verGuardado = () => {
    if (!guardado) return;
    setDatosFormulario(guardado.datos);
    setResultado(guardado.resultado);
    setEstadoAnalisis("completado");
  };

  const reiniciar = () => {
    setEstadoAnalisis("idle");
    setResultado(null);
    setDatosFormulario(null);
    setEtapaCarga(0);
  };

  const abrirChat = () => {
    chatRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    chatInputRef.current?.focus({ preventScroll: true });
  };

  return (
    <div className="min-h-screen bg-surface-2">
      {/* Header */}
      <header className="bg-surface border-b border-border sticky top-0 z-10 no-print">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-1.5 text-xs text-content-3 hover:text-content transition-colors mr-2">
              <ArrowLeft size={14} aria-hidden="true" /> Inicio
            </Link>
            <div className="w-px h-4 bg-border" />
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center" aria-hidden="true">
              <BarChart3 size={16} className="text-white" />
            </div>
            <p className="text-sm font-bold text-content leading-none">Viabilidad PYME</p>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {estadoAnalisis === "idle" && (
          <div className="max-w-2xl mx-auto">
            {guardado && (
              <div className="mb-6 flex items-center gap-3 rounded-xl border border-brand-soft-border bg-brand-soft px-4 py-3">
                <History size={16} className="text-brand-strong shrink-0" aria-hidden="true" />
                <p className="text-sm text-content-2 flex-1 min-w-0">
                  Tienes un análisis guardado de <strong className="text-content">{guardado.datos.nombreNegocio}</strong>
                  {" "}({new Date(guardado.fecha).toLocaleDateString("es-MX")}).
                </p>
                <button
                  type="button"
                  onClick={verGuardado}
                  className="text-sm font-medium text-brand-strong hover:underline shrink-0"
                >
                  Ver
                </button>
                <button
                  type="button"
                  onClick={() => escribirGuardado(null)}
                  className="p-1 text-content-3 hover:text-content shrink-0"
                  aria-label="Descartar análisis guardado"
                >
                  <X size={14} />
                </button>
              </div>
            )}
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-content leading-tight">Analiza la viabilidad de tu PYME</h1>
              <p className="text-content-3 mt-1.5 text-sm">
                Responde unas preguntas sobre tu negocio y obtén un diagnóstico basado en el RETyS de Baja California y el modelo de 10 criterios.
              </p>
            </div>
            <FormularioViabilidad onSubmit={handleSubmit} isLoading={false} />
          </div>
        )}

        {estadoAnalisis === "cargando" && (
          <div className="max-w-lg mx-auto">
            <PantallaCargando etapaActual={etapaCarga} />
          </div>
        )}

        {estadoAnalisis === "completado" && resultado && datosFormulario && (
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-start">
            <div className="xl:col-span-3 print:col-span-5">
              <PanelResultados
                resultado={resultado}
                nombreNegocio={datosFormulario.nombreNegocio}
                onNuevoAnalisis={reiniciar}
                onAbrirChat={abrirChat}
              />
            </div>
            <div
              ref={chatRef}
              className="xl:col-span-2 xl:sticky xl:top-20 h-[75vh] xl:h-[calc(100vh-6rem)] scroll-mt-20 no-print"
            >
              <ChatAnalisis datos={datosFormulario} resultado={resultado} inputRef={chatInputRef} />
            </div>
          </div>
        )}

        {estadoAnalisis === "error" && (
          <div className="max-w-md mx-auto text-center py-16" role="alert">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4" aria-hidden="true">
              <span className="text-2xl">⚠️</span>
            </div>
            <h2 className="text-lg font-semibold text-content mb-2">Error en el análisis</h2>
            <p className="text-sm text-content-3 mb-6">
              {mensajeError || "Hubo un problema al procesar tu solicitud. Verifica tu conexión e intenta de nuevo."}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {datosFormulario && (
                <button
                  type="button"
                  onClick={() => handleSubmit(datosFormulario)}
                  className="px-6 py-2.5 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-all"
                >
                  Reintentar con los mismos datos
                </button>
              )}
              <button
                type="button"
                onClick={reiniciar}
                className="px-6 py-2.5 border border-border text-content-2 text-sm font-medium rounded-lg hover:bg-surface transition-all"
              >
                Volver al formulario
              </button>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-border mt-12 py-6 no-print">
        <p className="text-center text-xs text-content-3">
          Viabilidad PYME · RETyS Baja California · IBM watsonx ·{" "}
          <Link href="/privacidad" className="underline hover:text-content">
            Aviso de privacidad
          </Link>
        </p>
      </footer>
    </div>
  );
}
