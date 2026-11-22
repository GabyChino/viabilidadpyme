/**
 * src/lib/investigacion.ts
 *
 * Investiga un negocio elegido en el mapa para prellenar el formulario:
 *   1. Ficha completa en OpenStreetMap (etiquetas como fecha de apertura o servicios)
 *      o en el DENUE de INEGI (giro SCIAN y tamaño por personal ocupado)
 *   2. Su sitio web, si tiene (título, descripción y menciones como "desde 1998")
 *   3. El agente IA redacta la descripción y deduce modelo, giro y antigüedad
 *      solo a partir de esa evidencia. Sin agente, se usan reglas simples.
 *
 * Solo se llenan datos que se pueden comprobar en fuentes públicas: las
 * finanzas, empleados o situación formal los conoce únicamente el dueño.
 */

import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { z } from "zod";
import type { InvestigacionNegocio, NegocioEncontrado } from "@/lib/types";
import { ANIOS_OPERACION_OPCIONES, GIROS_COMERCIALES, MODELO_NEGOCIO_OPCIONES } from "@/lib/constants";
import { fichaNominatim, resultadoDesdeOsm } from "@/lib/nominatim";
import { denueConfigurado, empleadosDesdeEstrato, fichaDenue, resultadoDesdeDenue } from "@/lib/denue";
import { conCache, HORA } from "@/lib/cache";
import { describirNegocioPublico } from "@/lib/negocios";
import { enviarMensajesAgente, extraerJson, isWatsonxConfigured, repararJson } from "@/lib/watsonx";

// ── Sitio web ────────────────────────────────────────────────────────────────

interface SitioWeb {
  url: string;
  titulo?: string;
  descripcion?: string;
  texto: string;
  anioFundacion?: number;
}

const MAX_BYTES = 400_000;

/** Bloquea direcciones internas para que el servidor no pueda usarse contra su propia red. */
function esIpPrivada(ip: string): boolean {
  if (isIP(ip) === 4) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224
    );
  }
  const v6 = ip.toLowerCase();
  if (v6.startsWith("::ffff:")) return esIpPrivada(v6.slice(7));
  return v6 === "::" || v6 === "::1" || v6.startsWith("fc") || v6.startsWith("fd") || v6.startsWith("fe80");
}

async function urlPublica(url: URL): Promise<boolean> {
  if (url.protocol !== "http:" && url.protocol !== "https:") return false;
  if (url.port && url.port !== "80" && url.port !== "443") return false;
  if (url.username || url.password) return false;
  try {
    const direcciones = await lookup(url.hostname, { all: true });
    return direcciones.length > 0 && direcciones.every((d) => !esIpPrivada(d.address));
  } catch {
    return false;
  }
}

function decodificarEntidades(texto: string): string {
  const nombradas: Record<string, string> = {
    amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", nbsp: " ", aacute: "á", eacute: "é", iacute: "í",
    oacute: "ó", uacute: "ú", ntilde: "ñ", Aacute: "Á", Eacute: "É", Iacute: "Í", Oacute: "Ó", Uacute: "Ú",
    Ntilde: "Ñ", uuml: "ü", iexcl: "¡", iquest: "¿",
  };
  return texto
    .replace(/&#(\d+);/g, (_m, n: string) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_m, n: string) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, n: string) => nombradas[n] ?? m);
}

function metaContenido(html: string, nombre: string): string | undefined {
  const patrones = [
    new RegExp(`<meta[^>]+(?:name|property)=["']${nombre}["'][^>]*content=["']([^"']*)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:name|property)=["']${nombre}["']`, "i"),
  ];
  for (const re of patrones) {
    const m = html.match(re);
    if (m?.[1]?.trim()) return decodificarEntidades(m[1].trim());
  }
  return undefined;
}

/** Año de fundación mencionado en el texto ("desde 1998", "más de 20 años"…). */
export function buscarAnioFundacion(texto: string, anioActual = new Date().getFullYear()): number | undefined {
  const desde = texto.match(/\b(?:desde|fundad[ao]s?\s+en|establecid[ao]s?\s+en|since|founded\s+in|est\.?)\s+(?:el\s+(?:año\s+)?)?((?:19|20)\d{2})\b/i);
  if (desde) {
    const anio = Number(desde[1]);
    if (anio >= 1900 && anio <= anioActual) return anio;
  }
  const mas = texto.match(/\b(?:más\s+de|mas\s+de|over|con)\s+(\d{1,3})\s+(?:años|anos|years)\b/i);
  if (mas) {
    const n = Number(mas[1]);
    if (n > 0 && n < 150) return anioActual - n;
  }
  return undefined;
}

async function leerSitioWeb(direccion: string): Promise<SitioWeb | null> {
  let url: URL;
  try {
    url = new URL(direccion.startsWith("http") ? direccion : `https://${direccion}`);
  } catch {
    return null;
  }

  // Las redirecciones se siguen a mano para revisar cada destino
  let res: Response | null = null;
  for (let salto = 0; salto < 4; salto++) {
    if (!(await urlPublica(url))) return null;
    res = await fetch(url, {
      redirect: "manual",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; PYME-Viabilidad-Tijuana/0.1)", Accept: "text/html" },
      signal: AbortSignal.timeout(7000),
    });
    const destino = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && destino) {
      url = new URL(destino, url);
      continue;
    }
    break;
  }
  if (!res?.ok || !res.body || !(res.headers.get("content-type") ?? "").includes("html")) return null;

  // Lee como máximo MAX_BYTES
  const lector = res.body.getReader();
  const partes: Uint8Array[] = [];
  let total = 0;
  while (total < MAX_BYTES) {
    const { done, value } = await lector.read();
    if (done) break;
    partes.push(value);
    total += value.length;
  }
  await lector.cancel().catch(() => undefined);
  const html = new TextDecoder("utf-8").decode(Buffer.concat(partes));

  const titulo = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1];
  const texto = decodificarEntidades(
    html
      .replace(/<(script|style|noscript|svg|template)[\s\S]*?<\/\1>/gi, " ")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 3000);

  return {
    url: url.toString(),
    titulo: titulo ? decodificarEntidades(titulo.trim()).slice(0, 150) : undefined,
    descripcion: (metaContenido(html, "description") ?? metaContenido(html, "og:description"))?.slice(0, 400),
    texto,
    anioFundacion: buscarAnioFundacion(texto),
  };
}

// ── Reglas (sin IA) ──────────────────────────────────────────────────────────

function aniosDesde(anio: number): string {
  const anios = new Date().getFullYear() - anio;
  if (anios < 1) return "menos_1";
  if (anios < 2) return "1_2";
  if (anios < 5) return "2_5";
  return "mas_5";
}

function anioDeEtiqueta(startDate?: string): number | undefined {
  const anio = Number(startDate?.match(/(?:19|20)\d{2}/)?.[0]);
  return anio >= 1900 && anio <= new Date().getFullYear() ? anio : undefined;
}

function descripcionPorReglas(n: NegocioEncontrado, tags: Record<string, string>, web: SitioWeb | null): string {
  if (web?.descripcion && web.descripcion.length >= 40) return web.descripcion;
  const partes = [
    `${n.categoria ?? "Negocio"}${n.especialidad ? ` especializado en ${n.especialidad}` : ""} ubicado en ${n.direccion}.`,
    n.marca && `Forma parte de la cadena ${n.marca}.`,
    n.horarios?.[0] && `Horario: ${n.horarios[0]}.`,
    tags.delivery === "yes" && "Ofrece servicio a domicilio.",
    tags.takeaway === "yes" && "Tiene servicio para llevar.",
    tags.description,
  ];
  return partes.filter(Boolean).join(" ").slice(0, 500);
}

function modeloPorReglas(n: NegocioEncontrado, tags: Record<string, string>): string {
  if (n.marca) return "franquicia";
  if (tags.shop === "wholesale" || tags.wholesale === "yes") return "b2b";
  return "b2c";
}

// ── IA ───────────────────────────────────────────────────────────────────────

const valores = (opciones: { value: string }[]) => opciones.map((o) => o.value) as [string, ...string[]];

const respuestaIaSchema = z.object({
  descripcion: z.string().min(20).max(600),
  modeloNegocio: z.enum(valores(MODELO_NEGOCIO_OPCIONES)).catch("b2c"),
  giroComercial: z.enum(valores(GIROS_COMERCIALES)).optional().catch(undefined),
  aniosEnOperacion: z.enum(valores(ANIOS_OPERACION_OPCIONES)).nullable().optional().catch(null),
});

async function redactarConIa(
  n: NegocioEncontrado,
  tags: Record<string, string>,
  web: SitioWeb | null
): Promise<z.infer<typeof respuestaIaSchema> | null> {
  if (!isWatsonxConfigured()) return null;

  const etiquetasUtiles = Object.entries(tags)
    .filter(([k]) => !/^(name|brand:wikidata|building|source|check_date|ref)/.test(k))
    .slice(0, 25)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
  const evidenciaWeb = web
    ? `\n\nSITIO WEB (${web.url}):\nTítulo: ${web.titulo ?? "—"}\nDescripción: ${web.descripcion ?? "—"}\nTexto: ${web.texto.slice(0, 2000)}`
    : "\n\nSITIO WEB: no tiene o no se pudo leer.";

  const prompt = `Tarea distinta al análisis de viabilidad: prellenar un formulario con datos públicos de un negocio de Tijuana.

DATOS PÚBLICOS DEL NEGOCIO:
${describirNegocioPublico(n)}
Etiquetas: ${etiquetasUtiles || "—"}${evidenciaWeb}

Responde ÚNICAMENTE con este JSON:
{
  "descripcion": "150 a 400 caracteres, en primera persona del plural como si la escribiera el dueño: qué vende u ofrece, a quién y qué lo distingue",
  "modeloNegocio": "b2c | b2b | mixto | online | franquicia",
  "giroComercial": "${GIROS_COMERCIALES.map((g) => g.value).join(" | ")}",
  "aniosEnOperacion": "menos_1 | 1_2 | 2_5 | mas_5 | null"
}

Reglas: usa solo la evidencia anterior, no inventes productos, precios, fechas ni cualidades. Si hay poca evidencia, escribe una descripción breve y factual (mínimo 60 caracteres). "aniosEnOperacion" es null si no hay una fecha o antigüedad explícita. Si pertenece a una cadena o marca conocida, el modelo es "franquicia". Dentro de los textos no uses comillas dobles.`;

  try {
    const contenido = await enviarMensajesAgente([{ role: "user", content: prompt }], 30000);
    const json = JSON.parse(repararJson(extraerJson(contenido)));
    const validado = respuestaIaSchema.safeParse(json);
    if (!validado.success) {
      console.warn("Investigación: respuesta de la IA con formato inesperado:", z.prettifyError(validado.error));
      return null;
    }
    return validado.data;
  } catch (error) {
    console.warn("Investigación: la IA no respondió, se usan reglas:", (error as Error).message.slice(0, 300));
    return null;
  }
}

// ── Investigación completa ───────────────────────────────────────────────────

/** Ficha del negocio en su fuente. Se vuelve a consultar en vez de confiar en los datos que manda el navegador. */
async function obtenerFicha(id: string) {
  if (id.startsWith("denue/")) {
    if (!denueConfigurado()) return null;
    const e = await fichaDenue(id.slice("denue/".length));
    return e ? { ...resultadoDesdeDenue(e), tags: {} as Record<string, string> } : null;
  }
  const ficha = await fichaNominatim(id);
  return ficha ? { ...resultadoDesdeOsm(ficha), tags: ficha.extratags ?? {} } : null;
}

export function investigarNegocio(id: string): Promise<InvestigacionNegocio | null> {
  return conCache(`investigar:${id}`, 24 * HORA, () => investigarSinCache(id));
}

async function investigarSinCache(id: string): Promise<InvestigacionNegocio | null> {
  const ficha = await obtenerFicha(id);
  if (!ficha) return null;
  const { negocio, giroSugerido, tags } = ficha;

  const web = negocio.sitioWeb ? await leerSitioWeb(negocio.sitioWeb).catch(() => null) : null;
  const ia = await redactarConIa(negocio, tags, web);

  // La antigüedad explícita (OSM o sitio web) tiene prioridad sobre la de la IA
  const anioFundacion = anioDeEtiqueta(tags.start_date ?? tags.opening_date) ?? web?.anioFundacion;
  const aniosEnOperacion = anioFundacion ? aniosDesde(anioFundacion) : (ia?.aniosEnOperacion ?? undefined);

  const sugerencias: InvestigacionNegocio["sugerencias"] = {
    descripcionNegocio: (ia?.descripcion ?? descripcionPorReglas(negocio, tags, web)).slice(0, 500),
    modeloNegocio: ia?.modeloNegocio ?? modeloPorReglas(negocio, tags),
    giroComercial: giroSugerido ?? ia?.giroComercial,
    aniosEnOperacion,
    numEmpleados: empleadosDesdeEstrato(negocio.tamano),
  };
  // Una descripción demasiado corta no pasa la validación del formulario
  if ((sugerencias.descripcionNegocio ?? "").length < 20) delete sugerencias.descripcionNegocio;

  const hallazgos = [
    anioFundacion && `Opera desde ${anioFundacion}`,
    negocio.marca && `Forma parte de ${negocio.marca}`,
    negocio.tamano && `Registrado en INEGI con ${negocio.tamano}`,
    negocio.horarios?.[0] && `Horario: ${negocio.horarios[0]}`,
    negocio.especialidad && `Especialidad: ${negocio.especialidad}`,
    tags.delivery === "yes" && "Ofrece servicio a domicilio",
    tags.takeaway === "yes" && "Tiene servicio para llevar",
    negocio.telefono && "Teléfono registrado",
    negocio.redesSociales?.length && "Redes sociales registradas",
    web && `Sitio web revisado: ${web.titulo ?? new URL(web.url).hostname}`,
  ].filter((x): x is string => !!x);

  const fuentes =
    negocio.fuente === "denue"
      ? [{ nombre: "DENUE (INEGI)", url: "https://www.inegi.org.mx/app/mapa/denue/" }]
      : [{ nombre: "OpenStreetMap", url: negocio.urlMapa ?? "https://www.openstreetmap.org" }];
  if (web) fuentes.push({ nombre: new URL(web.url).hostname, url: web.url });

  return {
    negocio,
    sugerencias,
    hallazgos: [...new Set(hallazgos)].slice(0, 6),
    fuentes,
    generadoPorIA: !!ia,
  };
}
