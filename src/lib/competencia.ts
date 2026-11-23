/**
 * src/lib/competencia.ts
 *
 * Cuenta los negocios del mismo giro alrededor del negocio (si se eligió en
 * el mapa) o del centro de su colonia:
 *   - DENUE de INEGI (si hay INEGI_DENUE_TOKEN): directorio oficial, incluye el
 *     tamaño de cada negocio y cubre todos los giros con equivalente SCIAN
 *   - OpenStreetMap: respaldo aproximado, no tiene registrados todos los comercios
 */

import type { CompetenciaZona, FormularioData } from "@/lib/types";
import { COLONIAS_TIJUANA, etiquetaDe } from "@/lib/constants";
import { buscarNominatim, distanciaMetros, TIPO_OSM, VIEWBOX_TIJUANA } from "@/lib/nominatim";
import { denueConfigurado, denueEnRadio, resultadoDesdeDenue } from "@/lib/denue";
import { sugerirGiro } from "@/lib/negocios";
import { conCache, HORA } from "@/lib/cache";

const RADIO_M = 800;
const LIMITE_POR_TIPO = 40; // máximo que devuelve Nominatim por búsqueda

// Etiquetas de OSM que representan competencia directa para cada giro.
// Los giros sin equivalente fiable en OSM (TI, consultoría, manufactura…) no se miden.
const ETIQUETAS_POR_GIRO: Record<string, string[]> = {
  restaurante_cafeteria: ["amenity=restaurant", "amenity=fast_food", "amenity=cafe"],
  tienda_abarrotes: ["shop=convenience", "shop=supermarket"],
  comercio_alimentos: ["shop=butcher", "shop=bakery", "shop=greengrocer"],
  ropa_calzado: ["shop=clothes", "shop=shoes"],
  ferreteria: ["shop=hardware", "shop=doityourself"],
  farmacia: ["amenity=pharmacy"],
  papeleria: ["shop=stationery", "shop=copyshop"],
  salon_belleza: ["shop=hairdresser", "shop=beauty"],
  taller_mecanico: ["shop=car_repair", "shop=tyres"],
  lavanderia: ["shop=laundry", "shop=dry_cleaning"],
  gimnasio: ["leisure=fitness_centre"],
  turismo_hospedaje: ["tourism=hotel", "tourism=motel", "tourism=guest_house"],
};

const TIPO_EXTRA: Record<string, string> = {
  copyshop: "Centro de copiado", doityourself: "Materiales / Ferretería", guest_house: "Casa de huéspedes",
};

// Los centros de colonia cambian poco: se guardan mientras viva el servidor
const centrosColonia = new Map<string, { lat: number; lng: number } | null>();

async function centroColonia(colonia: string): Promise<{ lat: number; lng: number } | null> {
  if (centrosColonia.has(colonia)) return centrosColonia.get(colonia)!;
  // "Centro / Zona Centro" → "Centro"; "Otay / Mesa de Otay" → "Otay"
  const nombre = etiquetaDe(COLONIAS_TIJUANA, colonia).split("/")[0].replace(/^Col\.\s*/, "").trim();
  const [r] = await buscarNominatim({ q: `${nombre}, Tijuana`, limit: "1", viewbox: VIEWBOX_TIJUANA, bounded: "1" });
  const centro = r ? { lat: Number(r.lat), lng: Number(r.lon) } : null;
  centrosColonia.set(colonia, centro);
  return centro;
}

// Giros que el mapa de palabras clave no distingue: un conteo daría siempre 0
const GIROS_SIN_MEDICION = new Set(["otro", "manufactura", "agropecuario"]);

/** Devuelve la competencia cercana, o null si el giro o la ubicación no se pueden medir. */
export async function analizarCompetencia(datos: FormularioData): Promise<CompetenciaZona | null> {
  const giro = datos.giroComercial;
  const usarDenue = denueConfigurado() && !GIROS_SIN_MEDICION.has(giro);
  if (!usarDenue && !ETIQUETAS_POR_GIRO[giro]) return null;

  const propio = datos.negocioEncontrado;
  let centro: CompetenciaZona["centro"] | null = null;
  if (propio?.lat !== undefined && propio.lng !== undefined) {
    centro = { lat: propio.lat, lng: propio.lng, origen: "negocio" };
  } else if (datos.colonia && datos.colonia !== "otra") {
    const c = await centroColonia(datos.colonia);
    if (c) centro = { ...c, origen: "colonia" };
  }
  if (!centro) return null;
  const c = centro;

  const clave = `competencia:${giro}:${c.lat.toFixed(4)},${c.lng.toFixed(4)}:${propio?.id ?? ""}`;
  return conCache(clave, 24 * HORA, async () => {
    if (usarDenue) {
      try {
        return await competenciaDenue(giro, c, propio);
      } catch (error) {
        console.warn("DENUE no disponible para la competencia, se usa OpenStreetMap:", error);
      }
    }
    return ETIQUETAS_POR_GIRO[giro] ? competenciaOsm(ETIQUETAS_POR_GIRO[giro], c, propio) : null;
  });
}

type Centro = CompetenciaZona["centro"];
type NegocioPropio = FormularioData["negocioEncontrado"];
type Cercano = { nombre: string; tipo: string; distanciaM: number; lat: number; lng: number };

function cercanos(negocios: Cercano[]): CompetenciaZona["cercanos"] {
  return [...negocios]
    .sort((a, b) => a.distanciaM - b.distanciaM)
    .slice(0, 5)
    .map(({ nombre, tipo, distanciaM }) => ({ nombre, tipo, distanciaM }));
}

function contar<T>(items: T[], clave: (x: T) => string): { valor: string; cantidad: number }[] {
  const conteo = new Map<string, number>();
  for (const x of items) conteo.set(clave(x), (conteo.get(clave(x)) ?? 0) + 1);
  return [...conteo].map(([valor, cantidad]) => ({ valor, cantidad })).sort((a, b) => b.cantidad - a.cantidad);
}

function normalizar(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[^a-z0-9]/g, "");
}

function mismoNombre(a: string, b: string): boolean {
  const [x, y] = [normalizar(a), normalizar(b)];
  return x.length > 0 && y.length > 0 && (x.startsWith(y) || y.startsWith(x));
}

/** Con el DENUE: todos los establecimientos del radio cuya clase SCIAN corresponde al mismo giro. */
async function competenciaDenue(giro: string, centro: Centro, propio: NegocioPropio): Promise<CompetenciaZona> {
  const todos = await denueEnRadio(centro.lat, centro.lng, RADIO_M);
  const similares = todos
    .filter((e) => sugerirGiro(e.Clase_actividad) === giro)
    .map((e) => resultadoDesdeDenue(e).negocio)
    .filter((n) => n.id !== propio?.id && n.lat !== undefined && n.lng !== undefined)
    // Un negocio elegido en OSM no tiene id del DENUE: se excluye si está en el mismo punto
    // y su nombre coincide (el DENUE suele agregar la sucursal: "Farmacias Roma Cuauhtemoc")
    .filter((n) => !(propio && mismoNombre(n.nombre, propio.nombre) && distanciaMetros(n.lat!, n.lng!, centro.lat, centro.lng) < 60));

  const negocios: (Cercano & { tamano: string })[] = similares.map((n) => ({
    nombre: n.nombre,
    tipo: n.categoria ?? "Comercio",
    tamano: n.tamano ?? "Sin dato",
    lat: n.lat!,
    lng: n.lng!,
    distanciaM: Math.round(distanciaMetros(centro.lat, centro.lng, n.lat!, n.lng!)),
  }));

  return {
    fuente: "denue",
    radioM: RADIO_M,
    centro,
    total: negocios.length,
    limiteAlcanzado: false,
    porTipo: contar(negocios, (n) => n.tipo).slice(0, 6).map(({ valor, cantidad }) => ({ tipo: valor, cantidad })),
    porTamano: contar(negocios, (n) => n.tamano).map(({ valor, cantidad }) => ({ tamano: valor, cantidad })),
    cercanos: cercanos(negocios),
  };
}

/** Con OpenStreetMap: búsquedas por etiqueta dentro del recuadro del círculo. */
async function competenciaOsm(etiquetas: string[], centro: Centro, propio: NegocioPropio): Promise<CompetenciaZona> {
  // Recuadro que contiene el círculo de búsqueda
  const dLat = RADIO_M / 111_320;
  const dLng = RADIO_M / (111_320 * Math.cos((centro.lat * Math.PI) / 180));
  const viewbox = [centro.lng - dLng, centro.lat + dLat, centro.lng + dLng, centro.lat - dLat]
    .map((n) => n.toFixed(5))
    .join(",");

  const vistos = new Set<string>();
  const negocios: Cercano[] = [];
  let limiteAlcanzado = false;

  for (const etiqueta of etiquetas) {
    const resultados = await buscarNominatim({
      q: `[${etiqueta}]`,
      layer: "poi",
      limit: String(LIMITE_POR_TIPO),
      viewbox,
      bounded: "1",
    });
    if (resultados.length >= LIMITE_POR_TIPO) limiteAlcanzado = true;

    for (const r of resultados) {
      const id = `${r.osm_type}/${r.osm_id}`;
      if (id === propio?.id || vistos.has(id)) continue;
      const lat = Number(r.lat);
      const lng = Number(r.lon);
      const distanciaM = Math.round(distanciaMetros(centro.lat, centro.lng, lat, lng));
      if (distanciaM > RADIO_M) continue;
      vistos.add(id);
      const nombre = r.name || "Sin nombre registrado";
      // El mismo local a veces está como punto y como edificio
      if (r.name && negocios.some((n) => n.nombre === nombre && distanciaMetros(n.lat, n.lng, lat, lng) < 60)) continue;
      const tipo = r.type ? (TIPO_OSM[r.type] ?? TIPO_EXTRA[r.type] ?? r.type.replace(/_/g, " ")) : "Comercio";
      negocios.push({ nombre, tipo, distanciaM, lat, lng });
    }
  }

  return {
    fuente: "osm",
    radioM: RADIO_M,
    centro,
    total: negocios.length,
    limiteAlcanzado,
    porTipo: contar(negocios, (n) => n.tipo).map(({ valor, cantidad }) => ({ tipo: valor, cantidad })),
    cercanos: cercanos(negocios),
  };
}

/** Texto para el agente IA. */
export function describirCompetencia(c: CompetenciaZona): string {
  const donde = c.centro.origen === "negocio" ? "del negocio" : "del centro de la colonia";
  const fuente = c.fuente === "denue" ? "DENUE de INEGI" : "OpenStreetMap";
  const lineas = [
    `Fuente: ${fuente}`,
    `Negocios similares registrados a menos de ${c.radioM} m ${donde}: ${c.total}${c.limiteAlcanzado ? " o más" : ""}`,
    c.porTipo.length > 0 && `Por tipo: ${c.porTipo.map((t) => `${t.tipo} (${t.cantidad})`).join(", ")}`,
    c.porTamano?.length && `Por tamaño (personas que trabajan): ${c.porTamano.map((t) => `${t.tamano} (${t.cantidad})`).join(", ")}`,
    c.cercanos.length > 0 &&
      `Más cercanos: ${c.cercanos.map((n) => `${n.nombre} — ${n.tipo}, a ${n.distanciaM} m`).join("; ")}`,
  ];
  return lineas.filter(Boolean).join("\n");
}
