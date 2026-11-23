/**
 * src/lib/denue.ts
 *
 * Cliente del DENUE de INEGI (Directorio Estadístico Nacional de Unidades
 * Económicas): el directorio oficial de negocios de México, con giro (clase
 * SCIAN), tamaño por personal ocupado y coordenadas.
 * Documentación: https://www.inegi.org.mx/servicios/api_denue.html
 *
 * Requiere INEGI_DENUE_TOKEN (gratuito, se obtiene al registrarse en esa página).
 * Sin token, la aplicación usa solo OpenStreetMap.
 */

import type { NegocioEncontrado, ResultadoBusqueda } from "@/lib/types";
import { sugerirColonia, sugerirGiro } from "@/lib/negocios";

const BASE = "https://www.inegi.org.mx/app/api/denue/v1/consulta";
const ENTIDAD_BC = "02";

/** Establecimiento tal como lo devuelve la API (todos los valores son texto). */
export interface EstablecimientoDenue {
  Id: string;
  CLEE?: string;
  Nombre?: string;
  Razon_social?: string;
  Clase_actividad?: string;
  Estrato?: string;
  Tipo_vialidad?: string;
  Calle?: string;
  Num_Exterior?: string;
  Num_Interior?: string;
  Colonia?: string;
  CP?: string;
  Ubicacion?: string;
  Telefono?: string;
  Correo_e?: string;
  Sitio_internet?: string;
  Tipo?: string;
  Longitud?: string;
  Latitud?: string;
}

export function denueConfigurado(): boolean {
  return !!process.env.INEGI_DENUE_TOKEN;
}

async function consultarDenue(ruta: string, timeoutMs = 15000): Promise<EstablecimientoDenue[]> {
  const token = process.env.INEGI_DENUE_TOKEN;
  if (!token) throw new Error("INEGI_DENUE_TOKEN no está configurado");
  const res = await fetch(`${BASE}/${ruta}/${encodeURIComponent(token)}`, {
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`DENUE respondió ${res.status}`);
  // Sin resultados, la API puede responder texto en vez de un arreglo JSON.
  // Un token inválido también llega con HTTP 200 ("No Autorizado, utilice una
  // clave valida"): debe ser un error para que se use OpenStreetMap, no "0 negocios".
  const texto = await res.text();
  if (/no autorizado|clave v[aá]lida/i.test(texto)) {
    throw new Error("DENUE rechazó el token: revisa INEGI_DENUE_TOKEN");
  }
  try {
    const datos: unknown = JSON.parse(texto);
    return Array.isArray(datos) ? (datos as EstablecimientoDenue[]).filter((e) => e && e.Id) : [];
  } catch {
    return [];
  }
}

// El DENUE escribe todo en mayúsculas: "FARMACIA SAN JOSE" → "Farmacia San Jose"
function capitalizar(texto?: string): string | undefined {
  if (!texto?.trim()) return undefined;
  return texto
    .trim()
    .toLowerCase()
    .replace(/(^|[\s(/-])(\p{L})/gu, (_m, antes: string, letra: string) => antes + letra.toUpperCase());
}

function oracion(texto?: string): string | undefined {
  if (!texto?.trim()) return undefined;
  const t = texto.trim().toLowerCase();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function limpiarWeb(url?: string): string | undefined {
  const u = url?.trim();
  if (!u || u.length < 4 || !u.includes(".")) return undefined;
  return u.toLowerCase().startsWith("http") ? u : `http://${u}`;
}

export function esDeTijuana(e: EstablecimientoDenue): boolean {
  return (e.Ubicacion ?? "").toUpperCase().includes("TIJUANA");
}

/** Convierte un establecimiento del DENUE en los datos del negocio y las sugerencias del formulario. */
export function resultadoDesdeDenue(e: EstablecimientoDenue): ResultadoBusqueda {
  const lat = Number(e.Latitud);
  const lng = Number(e.Longitud);
  const tieneCoordenadas = Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0;
  const calle = [capitalizar(e.Tipo_vialidad), capitalizar(e.Calle), e.Num_Exterior?.trim()].filter(Boolean).join(" ");
  const colonia = capitalizar(e.Colonia);
  const direccion = [calle, colonia, e.CP?.trim() && `C.P. ${e.CP.trim()}`, "Tijuana"].filter(Boolean).join(", ");

  const negocio: NegocioEncontrado = {
    fuente: "denue",
    id: `denue/${e.Id}`,
    nombre: capitalizar(e.Nombre) ?? capitalizar(e.Razon_social) ?? "Sin nombre",
    direccion,
    coloniaMapa: colonia,
    categoria: oracion(e.Clase_actividad)?.slice(0, 120),
    tamano: e.Estrato?.trim() || undefined,
    lat: tieneCoordenadas ? lat : undefined,
    lng: tieneCoordenadas ? lng : undefined,
    sitioWeb: limpiarWeb(e.Sitio_internet),
    telefono: e.Telefono?.trim() || undefined,
    urlMapa: tieneCoordenadas
      ? `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=18/${lat}/${lng}`
      : undefined,
  };
  return {
    negocio,
    giroSugerido: sugerirGiro(e.Clase_actividad),
    coloniaSugerida: sugerirColonia(e.Colonia) ?? (colonia ? "otra" : undefined),
  };
}

/** Busca negocios de Tijuana por nombre o razón social. */
export async function buscarDenuePorNombre(q: string, max = 6): Promise<ResultadoBusqueda[]> {
  // La ruta no admite "/" en el nombre
  const nombre = encodeURIComponent(q.replace(/\//g, " ").trim());
  const resultados = await consultarDenue(`Nombre/${nombre}/${ENTIDAD_BC}/1/60`);
  return resultados.filter(esDeTijuana).slice(0, max).map(resultadoDesdeDenue);
}

/** Ficha de un establecimiento a partir de su Id del DENUE. */
export async function fichaDenue(id: string): Promise<EstablecimientoDenue | null> {
  if (!/^\d+$/.test(id)) return null;
  const [e] = await consultarDenue(`Ficha/${id}`);
  return e ?? null;
}

/** Todos los establecimientos registrados en un radio (máximo 5,000 m según INEGI). */
export async function denueEnRadio(lat: number, lng: number, metros: number): Promise<EstablecimientoDenue[]> {
  const radio = Math.min(Math.max(Math.round(metros), 1), 5000);
  return consultarDenue(`Buscar/todos/${lat.toFixed(6)},${lng.toFixed(6)}/${radio}`, 20000);
}

/** Estrato del DENUE → opción de "personas que trabajan" del formulario. */
export function empleadosDesdeEstrato(estrato?: string): string | undefined {
  const minimo = Number(estrato?.match(/\d+/)?.[0]);
  if (!Number.isFinite(minimo) || !estrato) return undefined;
  if (minimo <= 5) return "2_5";
  if (minimo <= 10) return "6_10";
  if (minimo <= 30) return "11_30";
  return "mas_30";
}
