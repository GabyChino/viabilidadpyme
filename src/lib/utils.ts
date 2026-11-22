import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
  }).format(value);
}

export function getColorViabilidad(puntuacion: number): string {
  if (puntuacion >= 70) return "text-green-700 dark:text-green-400";
  if (puntuacion >= 40) return "text-amber-700 dark:text-amber-400";
  return "text-red-700 dark:text-red-400";
}

export function getBgViabilidad(puntuacion: number): string {
  if (puntuacion >= 70) return "bg-green-50 border-green-300 dark:bg-green-900/20 dark:border-green-700/50";
  if (puntuacion >= 40) return "bg-amber-50 border-amber-300 dark:bg-amber-900/20 dark:border-amber-700/50";
  return "bg-red-50 border-red-300 dark:bg-red-900/20 dark:border-red-700/50";
}

export function getLabelViabilidad(puntuacion: number): string {
  if (puntuacion >= 70) return "Alta viabilidad";
  if (puntuacion >= 40) return "Viabilidad moderada";
  return "Baja viabilidad";
}
