"use client";

import { useEffect, useRef, useState } from "react";
import { Search, MapPin, Check, Loader2, Sparkles, Store, FileCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMovimientoReducido } from "@/lib/useMovimientoReducido";

/*
 * Demo en bucle del flujo real de la app: buscar el negocio → investigarlo →
 * llenar el formulario → diagnóstico. Todo se deriva de un contador `t`
 * (décimas de segundo) para que la secuencia sea fácil de ajustar.
 */

const BUSQUEDA = "Tacos El Gordo";
const FASES = { resultados: 16, investigar: 30, llenar: 47, diagnostico: 63, fin: 100 };
const ETAPAS = ["Buscar", "Investigar", "Llenar", "Diagnóstico"];

function etapaActual(t: number) {
  if (t < FASES.investigar) return 0;
  if (t < FASES.llenar) return 1;
  if (t < FASES.diagnostico) return 2;
  return 3;
}

export function DemoAnimada() {
  const reducido = useMovimientoReducido();
  const ref = useRef<HTMLDivElement>(null);
  const [t, setT] = useState(0);

  useEffect(() => {
    if (reducido) return;
    const el = ref.current;
    let id: ReturnType<typeof setInterval> | undefined;
    // Solo avanza mientras la demo está en pantalla
    const observer = new IntersectionObserver(([entrada]) => {
      clearInterval(id);
      if (entrada.isIntersecting) id = setInterval(() => setT((n) => (n + 1) % FASES.fin), 100);
    });
    if (el) observer.observe(el);
    return () => {
      observer.disconnect();
      clearInterval(id);
    };
  }, [reducido]);

  // Sin animaciones se muestra directamente el diagnóstico
  const tt = reducido ? FASES.fin - 1 : t;
  const etapa = etapaActual(tt);
  const escrito = BUSQUEDA.slice(0, Math.min(tt, BUSQUEDA.length));

  return (
    <div ref={ref} className="relative" aria-label="Demostración animada: buscar un negocio y obtener su diagnóstico" role="img">
      <div className="rounded-2xl border border-border bg-surface shadow-xl shadow-brand-900/10 overflow-hidden">
        {/* Barra tipo navegador con las etapas */}
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border bg-surface-2">
          <div className="flex gap-1.5" aria-hidden="true">
            <span className="w-2.5 h-2.5 rounded-full bg-red-300 dark:bg-red-900" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-300 dark:bg-amber-900" />
            <span className="w-2.5 h-2.5 rounded-full bg-brand-300 dark:bg-brand-800" />
          </div>
          <div className="flex flex-1 justify-end gap-1">
            {ETAPAS.map((e, i) => (
              <span
                key={e}
                className={cn(
                  "text-[10px] font-semibold px-2 py-0.5 rounded-full transition-colors duration-300",
                  i === etapa ? "bg-brand-600 text-white" : i < etapa ? "text-brand-strong" : "text-content-3"
                )}
              >
                {i < etapa ? "✓ " : ""}
                {e}
              </span>
            ))}
          </div>
        </div>

        <div className="p-4 h-[330px] flex flex-col gap-3">
          {/* Buscador */}
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border bg-surface-2">
            <Search size={14} className="text-content-3 shrink-0" />
            <span className={cn("text-sm text-content", tt < FASES.resultados && "cursor-escritura")}>{escrito}</span>
          </div>

          {/* 0. Mientras se escribe: resultados fantasma */}
          {tt < FASES.resultados && (
            <div className="flex flex-col gap-2 opacity-60">
              {[0, 1].map((i) => (
                <div key={i} className="flex items-center gap-2.5 p-2.5 rounded-lg border border-dashed border-border">
                  <span className="w-3.5 h-3.5 rounded-full esqueleto-brillo shrink-0" />
                  <div className="flex-1 flex flex-col gap-1.5">
                    <div className="h-2 w-1/3 rounded esqueleto-brillo" />
                    <div className="h-2 w-2/3 rounded esqueleto-brillo" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 1. Resultados */}
          {tt >= FASES.resultados && tt < FASES.investigar && (
            <div className="flex flex-col gap-2">
              {[
                { nombre: "Tacos El Gordo", dir: "Blvd. Sánchez Taboada · Zona Río" },
                { nombre: "Tacos El Gordo", dir: "Av. Constitución · Zona Centro" },
              ].map((r, i) => (
                <div
                  key={r.dir}
                  className={cn(
                    "flex items-start gap-2.5 p-2.5 rounded-lg border animar-pop transition-colors duration-300",
                    i === 0 && tt >= 22 ? "border-brand-500 bg-brand-soft" : "border-border bg-surface-2"
                  )}
                  style={{ animationDelay: `${i * 120}ms` }}
                >
                  <MapPin size={14} className="text-brand-strong mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-content">{r.nombre}</p>
                    <p className="text-[11px] text-content-3">{r.dir}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 2. Investigación */}
          {tt >= FASES.investigar && tt < FASES.llenar && (
            <div className="rounded-lg border border-border bg-surface-2 p-3 animar-pop">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-content mb-2.5">
                <Sparkles size={13} className="text-brand-strong" /> Investigando tu negocio…
              </p>
              {["Ficha en el mapa", "Sitio web y horarios", "Redactando con IA"].map((paso, i) => {
                const listo = tt >= FASES.investigar + 4 + i * 5;
                return (
                  <p key={paso} className={cn("flex items-center gap-2 text-[11px] py-0.5", listo ? "text-content-2" : "text-content-3")}>
                    {listo ? <Check size={12} className="text-brand-strong animar-pop" /> : <Loader2 size={12} className="animate-spin" />}
                    {paso}
                  </p>
                );
              })}
            </div>
          )}

          {/* 3. Formulario llenándose */}
          {tt >= FASES.llenar && tt < FASES.diagnostico && (
            <div className="flex flex-col gap-2">
              {[
                { campo: "Nombre", valor: "Tacos El Gordo", desde: 48 },
                { campo: "Giro", valor: "Restaurante / Fonda", desde: 51 },
                { campo: "Colonia", valor: "Zona Río", desde: 54 },
              ].map((c) =>
                tt >= c.desde ? (
                  <div key={c.campo} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-brand-soft-border bg-brand-soft animar-pop">
                    <span className="text-[11px] text-content-3">{c.campo}</span>
                    <span className="text-xs font-semibold text-content">{c.valor}</span>
                  </div>
                ) : (
                  <div key={c.campo} className="h-[34px] rounded-lg esqueleto-brillo" />
                )
              )}
              <div className="px-3 py-2 rounded-lg border border-border bg-surface-2">
                <span className="text-[11px] text-content-3">Descripción</span>
                {tt >= 58 ? (
                  <p className="text-[11px] text-content-2 mt-0.5 animar-pop">Tacos de asada y adobada para vecinos y turistas de Zona Río…</p>
                ) : (
                  <div className="mt-1.5 flex flex-col gap-1">
                    <div className="h-2 rounded esqueleto-brillo" />
                    <div className="h-2 w-2/3 rounded esqueleto-brillo" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 4. Diagnóstico */}
          {tt >= FASES.diagnostico && <Diagnostico t={tt - FASES.diagnostico} />}
        </div>
      </div>

      {/* Etiqueta flotante */}
      <div className="hidden sm:flex absolute -bottom-4 -left-4 items-center gap-2 px-3 py-2 rounded-xl border border-border bg-surface shadow-lg animar-flotar-suave">
        <Sparkles size={14} className="text-brand-strong" />
        <span className="text-xs font-semibold text-content">Se llena solo</span>
      </div>
    </div>
  );
}

function Diagnostico({ t }: { t: number }) {
  const puntaje = Math.min(35, Math.round((t / 12) * 35));
  return (
    <div className="flex flex-col gap-2.5 animar-pop">
      <div className="flex items-center gap-4 p-3 rounded-lg border border-border bg-surface-2">
        {/* Medidor circular */}
        <div className="relative w-16 h-16 shrink-0">
          <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90" aria-hidden="true">
            <circle cx="18" cy="18" r="15.9" fill="none" className="stroke-surface-3" strokeWidth="3.5" />
            <circle
              cx="18" cy="18" r="15.9" fill="none" strokeWidth="3.5" strokeLinecap="round"
              className="stroke-brand-500"
              strokeDasharray={`${(puntaje / 50) * 100} 100`}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-content tabular-nums">{puntaje}</span>
        </div>
        <div>
          <p className="text-[11px] text-content-3">Viabilidad · de 50 puntos</p>
          <p className="text-sm font-bold text-content">Viabilidad con mejoras</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <div className="p-3 rounded-lg border border-border bg-surface-2">
          <p className="flex items-center gap-1 text-[11px] text-content-3"><Store size={11} /> Competencia</p>
          <p className="text-lg font-bold text-content tabular-nums">{t >= 8 ? 14 : Math.round((t / 8) * 14)}</p>
          <p className="text-[10px] text-content-3">a menos de 800 m</p>
        </div>
        <div className="p-3 rounded-lg border border-border bg-surface-2">
          <p className="flex items-center gap-1 text-[11px] text-content-3"><FileCheck size={11} /> Trámites</p>
          <p className="text-lg font-bold text-content tabular-nums">{t >= 10 ? 5 : Math.round((t / 10) * 5)}</p>
          <p className="text-[10px] text-content-3">del RETyS</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {["Fortalezas", "Riesgos", "Siguientes pasos"].map((x, i) =>
          t >= 14 + i * 3 ? (
            <span key={x} className="text-[10px] font-semibold px-2 py-1 rounded-full bg-brand-soft text-brand-strong animar-pop">
              {x}
            </span>
          ) : null
        )}
      </div>
    </div>
  );
}
