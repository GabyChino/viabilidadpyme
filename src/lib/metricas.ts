/**
 * src/lib/metricas.ts
 *
 * Métricas de operación como una línea JSON por evento en los logs del
 * servidor (Vercel, Docker, etc. las recogen sin configuración extra).
 * Permiten saber, por ejemplo, qué porcentaje de análisis sale del agente y
 * cuántos de la simulación, o cuántas respuestas hubo que reparar.
 * No se registran datos personales ni descripciones del negocio.
 */

export type EventoMetrica =
  | "analisis"
  | "agente_json_reparado"
  | "agente_respuesta_invalida"
  | "competencia"
  | "investigacion";

export function registrarMetrica(evento: EventoMetrica, datos: Record<string, string | number | boolean | null | undefined> = {}) {
  console.info(JSON.stringify({ metrica: evento, fecha: new Date().toISOString(), ...datos }));
}
