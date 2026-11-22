/**
 * src/lib/rate-limit.ts
 *
 * Límite de peticiones por IP con ventana fija, en memoria del proceso.
 * Protege los créditos de IBM watsonx ante abuso. En despliegues con varias
 * instancias (p. ej. Vercel serverless) cada instancia lleva su propio conteo;
 * para un límite global se necesitaría un almacén compartido (Redis, KV).
 */

import { NextRequest } from "next/server";

interface Ventana {
  inicio: number;
  conteo: number;
}

const ventanas = new Map<string, Ventana>();

export function obtenerIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "local"
  );
}

/**
 * Devuelve los segundos a esperar si se excedió el límite, o 0 si se permite.
 */
export function verificarLimite(
  clave: string,
  maxPeticiones: number,
  ventanaMs: number
): number {
  const ahora = Date.now();
  const v = ventanas.get(clave);

  if (!v || ahora - v.inicio >= ventanaMs) {
    ventanas.set(clave, { inicio: ahora, conteo: 1 });
    // Limpieza ocasional para que el mapa no crezca sin límite
    if (ventanas.size > 5000) {
      for (const [k, val] of ventanas) {
        if (ahora - val.inicio >= ventanaMs) ventanas.delete(k);
      }
    }
    return 0;
  }

  if (v.conteo >= maxPeticiones) {
    return Math.ceil((v.inicio + ventanaMs - ahora) / 1000);
  }

  v.conteo++;
  return 0;
}
