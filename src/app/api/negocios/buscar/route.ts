import { NextRequest, NextResponse } from "next/server";
import type { ResultadoBusqueda } from "@/lib/types";
import { obtenerIp, verificarLimite } from "@/lib/rate-limit";
import { buscarNominatim, distanciaMetros, resultadoDesdeOsm, VIEWBOX_TIJUANA } from "@/lib/nominatim";
import { buscarDenuePorNombre, denueConfigurado } from "@/lib/denue";
import { conCache, HORA } from "@/lib/cache";

/**
 * GET /api/negocios/buscar?q=<nombre del negocio>
 *
 * Busca negocios en Tijuana para que un negocio establecido pueda
 * seleccionarse en lugar de capturar sus datos a mano:
 *   - DENUE de INEGI (si hay INEGI_DENUE_TOKEN): directorio oficial, más completo
 *   - OpenStreetMap (Nominatim): siempre; aporta horarios, sitio web y redes
 * Si una fuente falla se usan los resultados de la otra.
 */

export async function GET(req: NextRequest) {
  const espera = verificarLimite(`buscar:${obtenerIp(req)}`, 20, 60_000);
  if (espera > 0) {
    return NextResponse.json(
      { error: `Demasiadas búsquedas seguidas. Intenta de nuevo en ${espera} s.` },
      { status: 429, headers: { "Retry-After": String(espera) } }
    );
  }

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 3 || q.length > 100) {
    return NextResponse.json(
      { error: "Escribe entre 3 y 100 caracteres para buscar." },
      { status: 400 }
    );
  }

  try {
    const resultados = await conCache(`buscar:${q.toLowerCase()}`, 6 * HORA, () => buscarTodo(q));
    return NextResponse.json({ resultados });
  } catch (error) {
    console.error("Error en /api/negocios/buscar:", error);
    return NextResponse.json(
      { error: "No se pudo completar la búsqueda. Intenta de nuevo o captura los datos a mano." },
      { status: 502 }
    );
  }
}

async function buscarTodo(q: string): Promise<ResultadoBusqueda[]> {
  const [denue, osm] = await Promise.allSettled([
    denueConfigurado() ? buscarDenuePorNombre(q) : Promise.resolve([]),
    buscarOsm(q),
  ]);
  if (denue.status === "rejected") console.warn("DENUE no disponible en la búsqueda:", denue.reason);
  if (denue.status === "rejected" && osm.status === "rejected") throw osm.reason;

  const deDenue = denue.status === "fulfilled" ? denue.value : [];
  const deOsm = osm.status === "fulfilled" ? osm.value : [];
  // Un negocio que aparece en ambas fuentes se muestra una vez (el registro del DENUE)
  const osmNuevos = deOsm.filter(({ negocio: o }) => !deDenue.some(({ negocio: d }) => mismoNegocio(d, o)));
  return [...deDenue, ...osmNuevos].slice(0, 8);
}

function normalizarNombre(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[^a-z0-9]/g, "");
}

function mismoNegocio(a: ResultadoBusqueda["negocio"], b: ResultadoBusqueda["negocio"]): boolean {
  if (normalizarNombre(a.nombre) !== normalizarNombre(b.nombre)) return false;
  if (a.lat === undefined || a.lng === undefined || b.lat === undefined || b.lng === undefined) return true;
  return distanciaMetros(a.lat, a.lng, b.lat, b.lng) < 150;
}

// ── OpenStreetMap — Nominatim ────────────────────────────────────────────────

async function buscarOsm(q: string): Promise<ResultadoBusqueda[]> {
  const data = await buscarNominatim({
    q,
    layer: "poi", // solo comercios y lugares, no calles con el mismo nombre
    addressdetails: "1",
    extratags: "1",
    limit: "8",
    viewbox: VIEWBOX_TIJUANA,
    bounded: "1",
  });
  return data.filter((r) => r.name).slice(0, 6).map(resultadoDesdeOsm);
}
