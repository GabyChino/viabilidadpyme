import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { obtenerIp, verificarLimite } from "@/lib/rate-limit";
import { investigarNegocio } from "@/lib/investigacion";
import { registrarMetrica } from "@/lib/metricas";

/**
 * POST /api/negocios/investigar  { id: "node/123" | "denue/456" }
 *
 * Investiga un negocio elegido en el mapa (OpenStreetMap o DENUE, su sitio web
 * y el agente IA) y devuelve sugerencias para prellenar el formulario.
 * Solo recibe el id: los datos se vuelven a consultar en el servidor.
 */

const cuerpoSchema = z.object({
  id: z.string().regex(/^(node|way|relation|denue)\/\d{1,15}$/),
});

export async function POST(req: NextRequest) {
  const espera = verificarLimite(`investigar:${obtenerIp(req)}`, 10, 60_000);
  if (espera > 0) {
    return NextResponse.json(
      { error: `Demasiadas consultas seguidas. Intenta de nuevo en ${espera} s.` },
      { status: 429, headers: { "Retry-After": String(espera) } }
    );
  }

  const cuerpo = cuerpoSchema.safeParse(await req.json().catch(() => null));
  if (!cuerpo.success) {
    return NextResponse.json({ error: "Identificador de negocio inválido." }, { status: 400 });
  }

  const inicio = Date.now();
  try {
    const investigacion = await investigarNegocio(cuerpo.data.id);
    registrarMetrica("investigacion", {
      fuente: cuerpo.data.id.split("/")[0] === "denue" ? "denue" : "osm",
      encontrado: !!investigacion,
      conIA: investigacion?.generadoPorIA,
      campos: investigacion ? Object.values(investigacion.sugerencias).filter(Boolean).length : 0,
      ms: Date.now() - inicio,
    });
    if (!investigacion) {
      return NextResponse.json({ error: "No encontramos ese negocio en el directorio." }, { status: 404 });
    }
    return NextResponse.json(investigacion);
  } catch (error) {
    console.error("Error en /api/negocios/investigar:", error);
    return NextResponse.json(
      { error: "No pudimos investigar el negocio. Puedes llenar los datos a mano." },
      { status: 502 }
    );
  }
}
