"use client";

import { useSyncExternalStore } from "react";

const CONSULTA = "(prefers-reduced-motion: reduce)";

function suscribir(callback: () => void) {
  const mq = window.matchMedia(CONSULTA);
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

/**
 * true si el sistema pide reducir el movimiento. Las animaciones hechas con
 * JavaScript (contadores, demos en bucle) deben mostrar su estado final.
 */
export function useMovimientoReducido(): boolean {
  return useSyncExternalStore(
    suscribir,
    () => window.matchMedia(CONSULTA).matches,
    () => false
  );
}
