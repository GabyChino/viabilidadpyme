/**
 * src/lib/nominatim.ts
 *
 * Cliente de Nominatim (buscador de OpenStreetMap) compartido por la búsqueda
 * de negocios, su investigación y el análisis de competencia. La política de
 * uso pide máximo 1 petición por segundo e identificarse con un User-Agent:
 * https://operations.osmfoundation.org/policies/nominatim/
 */

import type { NegocioEncontrado, ResultadoBusqueda } from "@/lib/types";
import { sugerirColonia, sugerirGiro } from "@/lib/negocios";

export interface NominatimResult {
  osm_type: string;
  osm_id: number;
  name?: string;
  display_name: string;
  lat: string;
  lon: string;
  category?: string;
  type?: string;
  address?: Record<string, string>;
  extratags?: Record<string, string> | null;
}

/** Recuadro de Tijuana (oeste, norte, este, sur) */
export const VIEWBOX_TIJUANA = "-117.13,32.57,-116.75,32.40";

// Tipos de OSM más comunes en comercios, para mostrarlos en español
export const TIPO_OSM: Record<string, string> = {
  restaurant: "Restaurante", fast_food: "Comida rápida", cafe: "Cafetería", bar: "Bar", pub: "Bar",
  bakery: "Panadería", butcher: "Carnicería", convenience: "Tienda de conveniencia", supermarket: "Supermercado",
  greengrocer: "Frutería", clothes: "Tienda de ropa", shoes: "Zapatería", hardware: "Ferretería",
  pharmacy: "Farmacia", chemist: "Farmacia", hairdresser: "Estética / Peluquería", beauty: "Salón de belleza",
  car_repair: "Taller mecánico", tyres: "Llantera", laundry: "Lavandería", dry_cleaning: "Tintorería",
  stationery: "Papelería", books: "Librería", fitness_centre: "Gimnasio", hotel: "Hotel", motel: "Motel",
  dentist: "Dentista", doctors: "Consultorio médico", clinic: "Clínica", school: "Escuela",
  variety_store: "Tienda de variedades", mobile_phone: "Tienda de celulares", electronics: "Electrónica",
  furniture: "Mueblería", florist: "Florería", optician: "Óptica", ice_cream: "Nevería", marketplace: "Mercado",
};

const USER_AGENT = "PYME-Viabilidad-Tijuana/0.1 (diagnostico de viabilidad para PYMES)";

// Las peticiones se encadenan para que salgan con al menos 1 s de separación
let cola: Promise<unknown> = Promise.resolve();
let ultimaPeticion = 0;

function consultarNominatim(ruta: "search" | "lookup", params: Record<string, string>): Promise<NominatimResult[]> {
  const peticion = cola.then(async () => {
    const espera = ultimaPeticion + 1000 - Date.now();
    if (espera > 0) await new Promise((r) => setTimeout(r, espera));
    ultimaPeticion = Date.now();

    const query = new URLSearchParams({ format: "jsonv2", "accept-language": "es", ...params });
    const res = await fetch(`https://nominatim.openstreetmap.org/${ruta}?${query}`, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`Nominatim respondió ${res.status}`);
    return (await res.json()) as NominatimResult[];
  });
  // Un error no debe bloquear las peticiones que siguen en la cola
  cola = peticion.catch(() => undefined);
  return peticion;
}

export function buscarNominatim(params: Record<string, string>): Promise<NominatimResult[]> {
  return consultarNominatim("search", { countrycodes: "mx", ...params });
}

/** Ficha completa de un lugar a partir de su id ("node/123", "way/456"). */
export async function fichaNominatim(id: string): Promise<NominatimResult | null> {
  const [tipo, numero] = id.split("/");
  const letra = { node: "N", way: "W", relation: "R" }[tipo];
  if (!letra || !/^\d+$/.test(numero ?? "")) return null;
  const [r] = await consultarNominatim("lookup", { osm_ids: `${letra}${numero}`, extratags: "1", addressdetails: "1" });
  return r ?? null;
}

// Horario de OSM ("Mo-Fr 09:00-18:00; Sa 10:00-14:00") en español
const DIAS_OSM: Record<string, string> = {
  Mo: "Lun", Tu: "Mar", We: "Mié", Th: "Jue", Fr: "Vie", Sa: "Sáb", Su: "Dom", PH: "festivos",
};

function traducirHorario(horario: string): string {
  if (horario.trim() === "24/7") return "Abierto 24 horas";
  return horario
    .replace(/\b(Mo|Tu|We|Th|Fr|Sa|Su|PH)\b/g, (d) => DIAS_OSM[d])
    .replace(/\boff\b/g, "cerrado")
    .replace(/;\s*/g, "; ");
}

/** Convierte un resultado de Nominatim en los datos del negocio y las sugerencias del formulario. */
export function resultadoDesdeOsm(r: NominatimResult): ResultadoBusqueda {
  const tags = r.extratags ?? {};
  const dir = r.address ?? {};
  // Colonia según OSM (el nivel cambia de un lugar a otro)
  const colonia = dir.neighbourhood ?? dir.quarter ?? dir.suburb ?? dir.city_district;
  const calle = [dir.road, dir.house_number].filter(Boolean).join(" ");
  const direccion = [calle, colonia, dir.postcode && `C.P. ${dir.postcode}`, dir.city ?? "Tijuana"]
    .filter(Boolean)
    .join(", ");
  const redes = [tags["contact:facebook"] ?? tags.facebook, tags["contact:instagram"] ?? tags.instagram]
    .filter((x): x is string => !!x);
  // La etiqueta cruda (p. ej. "amenity fast_food") sirve para sugerir el giro
  const etiquetaOsm = [r.category, r.type, tags.cuisine].filter(Boolean).join(" ");

  const negocio: NegocioEncontrado = {
    fuente: "osm",
    id: `${r.osm_type}/${r.osm_id}`,
    nombre: r.name || "Sin nombre",
    direccion: direccion || r.display_name,
    coloniaMapa: colonia,
    categoria: r.type ? (TIPO_OSM[r.type] ?? r.type.replace(/_/g, " ")) : undefined,
    especialidad: tags.cuisine?.replace(/_/g, " ").replace(/;/g, ", "),
    marca: tags.brand,
    lat: Number(r.lat),
    lng: Number(r.lon),
    sitioWeb: tags.website ?? tags["contact:website"],
    telefono: tags.phone ?? tags["contact:phone"],
    redesSociales: redes.length ? redes : undefined,
    horarios: tags.opening_hours ? [traducirHorario(tags.opening_hours).slice(0, 200)] : undefined,
    urlMapa: `https://www.openstreetmap.org/${r.osm_type}/${r.osm_id}`,
  };
  return {
    negocio,
    giroSugerido: sugerirGiro(etiquetaOsm),
    // Si la colonia no está en la lista, se elige "otra" y el nombre real viaja en coloniaMapa
    coloniaSugerida: sugerirColonia(`${colonia ?? ""} ${r.display_name}`) ?? (colonia ? "otra" : undefined),
  };
}

/** Distancia en metros entre dos puntos (fórmula del semiverseno). */
export function distanciaMetros(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLng = (lng2 - lng1) * rad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(a));
}
