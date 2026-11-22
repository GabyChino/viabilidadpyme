"use client";

import { useEffect, useRef, useState } from "react";
import { useMovimientoReducido } from "@/lib/useMovimientoReducido";

/** Palabra que cambia cada pocos segundos dentro de un titular. */
export function PalabraRotativa({ palabras, intervaloMs = 2200 }: { palabras: string[]; intervaloMs?: number }) {
  const reducido = useMovimientoReducido();
  const [i, setI] = useState(0);

  useEffect(() => {
    if (reducido) return;
    const id = setInterval(() => setI((n) => (n + 1) % palabras.length), intervaloMs);
    return () => clearInterval(id);
  }, [reducido, palabras.length, intervaloMs]);

  const palabra = reducido ? palabras[palabras.length - 1] : palabras[i];
  return (
    <span className="inline-block" aria-live="off">
      {/* La key reinicia la animación de entrada en cada cambio */}
      <span key={palabra} className="inline-block animar-palabra">{palabra}</span>
    </span>
  );
}

/** Número que cuenta desde 0 cuando entra en pantalla. */
export function Contador({ hasta, duracionMs = 1400, prefijo = "", sufijo = "" }: { hasta: number; duracionMs?: number; prefijo?: string; sufijo?: string }) {
  const reducido = useMovimientoReducido();
  const ref = useRef<HTMLSpanElement>(null);
  const [valor, setValor] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el || reducido) return;
    let frame = 0;
    const observer = new IntersectionObserver(([entrada]) => {
      if (!entrada.isIntersecting) return;
      observer.disconnect();
      const inicio = performance.now();
      const paso = (ahora: number) => {
        const t = Math.min((ahora - inicio) / duracionMs, 1);
        setValor(Math.round(hasta * (1 - Math.pow(1 - t, 3)))); // desacelera al final
        if (t < 1) frame = requestAnimationFrame(paso);
      };
      frame = requestAnimationFrame(paso);
    }, { threshold: 0.4 });
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [hasta, duracionMs, reducido]);

  return (
    <span ref={ref} className="tabular-nums">
      {prefijo}
      {(reducido ? hasta : valor).toLocaleString("es-MX")}
      {sufijo}
    </span>
  );
}

/** Manchas de color difuminadas que flotan detrás de una sección. */
export function FondoAnimado({ intenso = false }: { intenso?: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className={`absolute -top-24 -left-16 w-72 h-72 rounded-full blur-3xl animar-flotar ${intenso ? "bg-white/15" : "bg-brand-300/30 dark:bg-brand-700/20"}`} />
      <div
        className={`absolute top-1/3 -right-20 w-80 h-80 rounded-full blur-3xl animar-flotar ${intenso ? "bg-brand-300/25" : "bg-brand-200/40 dark:bg-brand-800/25"}`}
        style={{ animationDelay: "-5s" }}
      />
      <div
        className={`absolute -bottom-24 left-1/3 w-64 h-64 rounded-full blur-3xl animar-flotar ${intenso ? "bg-brand-200/20" : "bg-amber-200/30 dark:bg-amber-900/15"}`}
        style={{ animationDelay: "-9s" }}
      />
      {/* Cuadrícula sutil que se desvanece hacia los bordes */}
      <div
        className={`absolute inset-0 ${intenso ? "opacity-[0.08]" : "opacity-[0.35] dark:opacity-[0.12]"}`}
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--color-border) 1px, transparent 1px), linear-gradient(to bottom, var(--color-border) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
        }}
      />
    </div>
  );
}
