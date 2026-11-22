/**
 * src/lib/watsonx.ts
 *
 * Cliente HTTP para IBM watsonx Orchestrate.
 * Autentica vía IBM Cloud IAM y envía mensajes al agente de viabilidad PYME.
 *
 * Variables de entorno requeridas:
 *   WATSONX_API_KEY          — IBM Cloud API Key
 *   WATSONX_INSTANCE_URL     — URL base de la instancia (ej: https://api.us-south.watsonx-orchestrate.ibm.com)
 *   WATSONX_AGENT_ID         — ID del agente de viabilidad en Orchestrate
 *
 * Opcionales:
 *   WATSONX_IAM_URL          — URL IAM (default: https://iam.cloud.ibm.com/identity/token)
 *   WATSONX_TIMEOUT_MS       — Timeout en ms (default: 60000)
 */

import { z } from "zod";
import { CompetenciaZona, FormularioData } from "@/lib/types";
import { describirCompetencia } from "@/lib/competencia";
import { registrarMetrica } from "@/lib/metricas";
import {
  GIROS_COMERCIALES,
  MODELO_NEGOCIO_OPCIONES,
  COLONIAS_TIJUANA,
  RANGOS_CAPITAL,
  EMPLEADOS_OPCIONES,
  EXPERIENCIA_OPCIONES,
  ANIOS_OPERACION_OPCIONES,
  SITUACION_FORMAL_OPCIONES,
  RETO_PRINCIPAL_OPCIONES,
  etiquetaDe,
} from "@/lib/constants";
import { describirNegocioPublico } from "@/lib/negocios";

// ── Tipos internos ───────────────────────────────────────────────────────────

interface IamTokenResponse {
  access_token: string;
  expiration: number;
}

// ── Esquema de la respuesta del agente ───────────────────────────────────────
// El LLM puede omitir campos o devolver números como texto: se normaliza aquí
// para que el resto de la app reciba siempre una estructura completa.

const listaTexto = z.array(z.string()).catch([]).default([]);

const criterioSchema = z.object({
  nombre: z.string(),
  descripcion: z.string().catch("").default(""),
  puntaje: z.coerce.number().min(1).max(5),
});

const tramiteSchema = z.object({
  nombre: z.string(),
  dependencia: z.string().catch("").default(""),
  aplicabilidad: z
    .enum(["CONFIRMADO", "POSIBLEMENTE APLICABLE", "NO CONFIRMADO", "NO APLICABLE"])
    .catch("NO CONFIRMADO"),
  costo: z.string().catch("No especificado").default("No especificado"),
  plazo: z.string().catch("No especificado").default("No especificado"),
});

const agentResponseSchema = z
  .object({
    resumenEjecutivo: z.string().min(1),
    criterios: z.array(criterioSchema).min(1),
    puntajeTotal: z.coerce.number().min(0).max(50).optional(),
    clasificacion: z.string().optional(),
    nivelConfianza: z.string().catch("Confianza limitada").default("Confianza limitada"),
    fortalezas: listaTexto,
    riesgos: listaTexto,
    incertidumbres: listaTexto,
    tramitesIdentificados: z.array(tramiteSchema).catch([]).default([]),
    siguientesPasos: listaTexto,
    notaMetodologica: z.string().catch("").default(""),
  })
  .transform((r) => {
    // Si el agente no envía el total, se recalcula a partir de los criterios
    const puntajeTotal =
      r.puntajeTotal ?? r.criterios.reduce((acc, c) => acc + c.puntaje, 0);
    return {
      ...r,
      puntajeTotal,
      clasificacion: r.clasificacion ?? clasificarPuntaje(puntajeTotal),
    };
  });

export type WatsonxAgentResponse = z.infer<typeof agentResponseSchema>;

export function clasificarPuntaje(puntaje50: number): string {
  if (puntaje50 >= 45) return "Alta viabilidad estimada";
  if (puntaje50 >= 35) return "Viabilidad con mejoras sugeridas";
  return "Requiere ajustes significativos";
}

// ── Cache de token IAM ────────────────────────────────────────────────────────

let cachedToken: string | null = null;
let tokenExpiration = 0;

export async function getIamToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  // Reusar token si aún es válido (con 5 min de margen)
  if (cachedToken && tokenExpiration > now + 300) {
    return cachedToken;
  }

  const iamUrl =
    process.env.WATSONX_IAM_URL ??
    "https://iam.cloud.ibm.com/identity/token";

  const apiKey = process.env.WATSONX_API_KEY;
  if (!apiKey) {
    throw new Error(
      "WATSONX_API_KEY no está configurado. Agrega esta variable de entorno."
    );
  }

  const params = new URLSearchParams({
    grant_type: "urn:ibm:params:oauth:grant-type:apikey",
    apikey: apiKey,
  });

  const res = await fetch(iamUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Error obteniendo token IAM (${res.status}): ${text}`);
  }

  const data: IamTokenResponse = await res.json();
  cachedToken = data.access_token;
  tokenExpiration = data.expiration;

  return cachedToken;
}

// ── Construcción del prompt para el agente ────────────────────────────────────

// Estructura que debe devolver el agente. Se incluye en cada mensaje para no
// depender solo de las instrucciones configuradas en Orchestrate.
const FORMATO_JSON = `{
  "resumenEjecutivo": "string (20-60 palabras)",
  "criterios": [{ "nombre": "string", "descripcion": "string (máx. 20 palabras)", "puntaje": 1-5 }],
  "puntajeTotal": 10-50,
  "clasificacion": "Alta viabilidad estimada | Viabilidad con mejoras sugeridas | Requiere ajustes significativos",
  "nivelConfianza": "Alta confianza | Confianza media | Confianza limitada",
  "fortalezas": ["string"],
  "riesgos": ["string"],
  "incertidumbres": ["string"],
  "tramitesIdentificados": [{ "nombre": "string", "dependencia": "string", "aplicabilidad": "CONFIRMADO | POSIBLEMENTE APLICABLE | NO CONFIRMADO | NO APLICABLE", "costo": "string", "plazo": "string" }],
  "siguientesPasos": ["string", "string"],
  "notaMetodologica": "string"
}`;

const LOCAL_TEXTO = {
  nuevo: { si: "Contará con local físico", no: "Operará a domicilio / en campo", virtual: "Operará 100% en línea" },
  establecido: { si: "Tiene local físico", no: "Opera a domicilio / en campo", virtual: "Opera 100% en línea" },
};

function buildAgentPrompt(datos: FormularioData, competencia: CompetenciaZona | null): string {
  const esEstablecido = datos.tipoPerfil === "establecido";
  const giro = etiquetaDe(GIROS_COMERCIALES, datos.giroComercial);

  const financiamiento = datos.requiereFinanciamiento
    ? `Sí${datos.montoFinanciamiento ? `, aprox. ${datos.montoFinanciamiento.replace(/_/g, " ")} MXN` : ""}`
    : "No";

  const lineas = [
    `**Perfil:** ${esEstablecido ? "Negocio establecido (ya opera)" : "Emprendedor nuevo (aún no opera)"}`,
    `**Nombre:** ${datos.nombreNegocio}`,
    `**Giro comercial:** ${giro}`,
    `**Descripción:** ${datos.descripcionNegocio}`,
    `**Modelo de negocio:** ${etiquetaDe(MODELO_NEGOCIO_OPCIONES, datos.modeloNegocio)}`,
    `**Ubicación:** ${datos.colonia === "otra" && datos.negocioEncontrado?.coloniaMapa ? datos.negocioEncontrado.coloniaMapa : etiquetaDe(COLONIAS_TIJUANA, datos.colonia)}, ${datos.municipio}, ${datos.estado}`,
    `**Establecimiento:** ${LOCAL_TEXTO[esEstablecido ? "establecido" : "nuevo"][datos.tieneLocal]}`,
    `**${esEstablecido ? "Capital disponible para invertir" : "Capital inicial disponible"}:** ${etiquetaDe(RANGOS_CAPITAL, datos.capitalDisponible)}`,
    `**${esEstablecido ? "Ventas mensuales promedio (reales)" : "Ventas mensuales estimadas"}:** ${datos.ventasMensualesEstimadas.replace(/_/g, " ")} MXN`,
    `**Requiere financiamiento:** ${financiamiento}`,
    `**${esEstablecido ? "Personas trabajando" : "Empleados planeados"}:** ${etiquetaDe(EMPLEADOS_OPCIONES, datos.numEmpleados)}`,
    `**Experiencia en el sector:** ${etiquetaDe(EXPERIENCIA_OPCIONES, datos.experienciaPrevia)}`,
  ];
  if (esEstablecido) {
    lineas.push(
      `**Tiempo en operación:** ${etiquetaDe(ANIOS_OPERACION_OPCIONES, datos.aniosEnOperacion)}`,
      `**Situación formal:** ${etiquetaDe(SITUACION_FORMAL_OPCIONES, datos.situacionFormal)}`,
      `**Reto principal:** ${etiquetaDe(RETO_PRINCIPAL_OPCIONES, datos.retoPrincipal)}`
    );
  }

  if (datos.camposAutollenados?.includes("descripcionNegocio")) {
    lineas.push("_La descripción se redactó automáticamente con datos públicos y el usuario la revisó._");
  }

  const datosPublicos = datos.negocioEncontrado
    ? `

## DATOS PÚBLICOS DEL NEGOCIO (seleccionado por el usuario en el mapa)

${describirNegocioPublico(datos.negocioEncontrado)}

Usa estos datos como evidencia: la ubicación y la categoría ayudan a evaluar la competencia en la zona
(criterio 5, junto con la competencia cercana); el sitio web, el teléfono, las redes sociales y los horarios indican presencia digital y
capacidad operativa (criterios 6 y 10). Que un dato no esté registrado en OpenStreetMap no significa
que el negocio no lo tenga: menciónalo como oportunidad, no como un hecho.`
    : "";

  const datosCompetencia = competencia
    ? `

## COMPETENCIA CERCANA

${describirCompetencia(competencia)}

Usa este conteo como evidencia para el criterio 5 (Actividad Económica Similar) y en riesgos u
oportunidades. ${
        competencia.fuente === "denue"
          ? "Proviene del directorio oficial de INEGI; el tamaño indica si la competencia son micronegocios o empresas grandes."
          : "OpenStreetMap no tiene registrados todos los comercios: trátalo como un mínimo, no como el total real, y menciónalo en incertidumbres si la cifra es baja."
      }`
    : "";

  const enfoque = esEstablecido
    ? `El negocio YA OPERA: evalúa su situación actual y su potencial de crecimiento, no la apertura.
- En trámites, distingue los que probablemente ya tiene de los que le faltan según su situación formal.
- Enfoca los siguientes pasos en su reto principal.`
    : `El negocio AÚN NO OPERA: evalúa la viabilidad de la idea y los trámites necesarios para abrir.`;

  return `Analiza la viabilidad de este negocio y devuelve un JSON con la estructura requerida.

## DATOS DEL NEGOCIO

${lineas.join("\n")}${datosPublicos}${datosCompetencia}

## ENFOQUE

${enfoque}

## INSTRUCCIÓN

1. Usa la herramienta "buscar_tramites_retys" o tu base de conocimiento RETyS para identificar trámites aplicables al giro "${giro}" en ${datos.municipio}.
2. Aplica el Módulo 01 (Investigación) basándote en los datos proporcionados y tu conocimiento del ecosistema empresarial de Tijuana, B.C.
3. Aplica el Módulo 03 (Matriz de Riesgos) para identificar los principales riesgos.
4. Aplica el Módulo 04 (Evaluación — 10 criterios / 50 puntos) con base en la evidencia recopilada.
5. Genera el Módulo 05 (Informe) como un objeto JSON con EXACTAMENTE esta estructura:

${FORMATO_JSON}

Responde ÚNICAMENTE con el objeto JSON completo (todos los campos). No devuelvas solo la lista de trámites. No incluyas markdown, texto adicional ni explicaciones fuera del JSON. Dentro de los textos no uses comillas dobles: para citar nombres usa comillas simples o «».`;
}

// ── Llamada al agente ─────────────────────────────────────────────────────────

export interface MensajeAgente {
  role: "user" | "assistant";
  content: string;
}

/**
 * Envía mensajes al agente de Orchestrate y devuelve el texto de su respuesta.
 * POST {instanceUrl}/v1/orchestrate/{agentId}/chat/completions
 */
export async function enviarMensajesAgente(
  messages: MensajeAgente[],
  timeoutMs = Number(process.env.WATSONX_TIMEOUT_MS ?? "60000")
): Promise<string> {
  const instanceUrl = process.env.WATSONX_INSTANCE_URL;
  const agentId = process.env.WATSONX_AGENT_ID;

  if (!instanceUrl || !agentId) {
    throw new Error(
      "WATSONX_INSTANCE_URL y WATSONX_AGENT_ID son requeridos. " +
        "Configura estas variables de entorno en .env.local"
    );
  }

  const token = await getIamToken();
  const endpoint = `${instanceUrl}/v1/orchestrate/${agentId}/chat/completions`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  // El timeout cubre también la lectura del cuerpo, no solo los encabezados
  let responseData;
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ messages, stream: false }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(
        `Error del agente watsonx (${res.status}): ${errorText}`
      );
    }

    responseData = await res.json();
  } finally {
    clearTimeout(timeoutId);
  }

  // Extraer el contenido del mensaje de respuesta
  // El agente puede devolver texto en choices[0].message.content (string)
  // o en un array de content items con response_type "text" (Orchestrate nativo)
  const rawContent = responseData?.choices?.[0]?.message?.content;
  let content: string;

  if (typeof rawContent === "string") {
    content = rawContent;
  } else if (Array.isArray(rawContent)) {
    content = (rawContent as Array<{response_type?: string; text?: string}>)
      .filter((c) => c.response_type === "text" && c.text)
      .map((c) => c.text)
      .join("\n");
  } else {
    content = "";
  }

  // Fallbacks adicionales
  if (!content) {
    content =
      responseData?.output?.content ??
      responseData?.message?.content ??
      "";
  }

  if (!content) {
    throw new Error(
      "El agente no devolvió contenido. Respuesta completa: " +
        JSON.stringify(responseData)
    );
  }

  return content;
}

export async function callViabilidadAgent(
  datos: FormularioData,
  competencia: CompetenciaZona | null = null
): Promise<WatsonxAgentResponse> {
  const mensajes: MensajeAgente[] = [{ role: "user", content: buildAgentPrompt(datos, competencia) }];

  // El modelo a veces devuelve JSON mal formado de forma intermitente:
  // si no se puede leer ni reparar, se reintenta una vez.
  let ultimoError: unknown;
  for (let intento = 1; intento <= 2; intento++) {
    const content = await enviarMensajesAgente(mensajes);
    try {
      return parsearRespuestaAgente(content);
    } catch (error) {
      ultimoError = error;
      registrarMetrica("agente_respuesta_invalida", { intento });
      console.warn(`Respuesta del agente no válida (intento ${intento} de 2):`, (error as Error).message.slice(0, 600));
    }
  }
  throw ultimoError;
}

/** Extrae el objeto JSON de la respuesta (puede venir con markdown o texto alrededor). */
export function extraerJson(content: string): string {
  let jsonStr = content.trim();

  // Extraer bloque ```json ... ```
  const fenceMatch = jsonStr.match(/```json\s*([\s\S]*?)```/i);
  if (fenceMatch) return fenceMatch[1].trim();

  // Quitar fences genéricos y texto introductorio
  jsonStr = jsonStr.replace(/^```[a-z]*\s*/i, "").replace(/```\s*$/i, "").trim();
  const objStart = jsonStr.indexOf("{");
  const objEnd = jsonStr.lastIndexOf("}");
  return objStart !== -1 && objEnd > objStart ? jsonStr.slice(objStart, objEnd + 1) : jsonStr;
}

/**
 * Repara errores típicos del modelo: comas sobrantes antes de } o ],
 * comillas sin escapar dentro de textos y valores de texto sin comillas
 * (p. ej. "descripcion": alta demanda"). Las reparaciones se prueban de menor
 * a mayor y se devuelve la primera que produce JSON válido (o la última).
 */
export function repararJson(jsonStr: string): string {
  const base = jsonStr.replace(/,(\s*[}\]])/g, "$1");
  const candidatos = [
    base,
    escaparComillasInternas(base),
    citarValoresSueltos(base),
    escaparComillasInternas(citarValoresSueltos(base)),
  ];
  for (const candidato of candidatos) {
    try {
      JSON.parse(candidato);
      return candidato;
    } catch {
      // probar la siguiente reparación
    }
  }
  return candidatos[candidatos.length - 1];
}

function citarValoresSueltos(jsonStr: string): string {
  return jsonStr.replace(
    /(:[ \t]*)(?![\s"[{]|-?\d|true\b|false\b|null\b)([^\n{}[\]"]+?)"?([ \t]*(?:,|\n|}|]))/g,
    (_m, antes: string, valor: string, despues: string) =>
      `${antes}${JSON.stringify(valor.trim().replace(/"$/, ""))}${despues}`
  );
}

/**
 * Escapa comillas dentro de textos (p. ej. "cerca de "Farmacias del Ahorro" a 80 m").
 * Dentro de un texto, una comilla solo lo cierra si después viene , } ] o :
 */
function escaparComillasInternas(jsonStr: string): string {
  let salida = "";
  let enTexto = false;
  for (let i = 0; i < jsonStr.length; i++) {
    const c = jsonStr[i];
    if (enTexto && c === "\\") {
      salida += c + (jsonStr[i + 1] ?? "");
      i++;
      continue;
    }
    if (c === '"') {
      if (!enTexto) {
        enTexto = true;
      } else {
        const siguiente = jsonStr.slice(i + 1).match(/\S/)?.[0];
        if (siguiente !== undefined && !",}]:".includes(siguiente)) {
          salida += '\\"';
          continue;
        }
        enTexto = false;
      }
    }
    salida += c;
  }
  return salida;
}

function parsearRespuestaAgente(content: string): WatsonxAgentResponse {
  const jsonStr = extraerJson(content);

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    const reparado = repararJson(jsonStr);
    try {
      parsed = JSON.parse(reparado);
      registrarMetrica("agente_json_reparado");
    } catch (error) {
      // Muestra el texto alrededor del error para poder ajustar la reparación
      const mensaje = (error as Error).message;
      const posicion = Number(mensaje.match(/position (\d+)/)?.[1] ?? NaN);
      const contexto = Number.isNaN(posicion)
        ? `Inicio: ${content.slice(0, 300)}`
        : `Cerca del error: …${reparado.slice(Math.max(0, posicion - 200), posicion + 100)}…`;
      throw new Error(
        `El agente devolvió una respuesta que no es JSON válido (${content.length} caracteres): ${mensaje}. ${contexto}`
      );
    }
  }

  const validado = agentResponseSchema.safeParse(parsed);
  if (!validado.success) {
    throw new Error(
      `La respuesta del agente no tiene la estructura esperada: ${z.prettifyError(validado.error)}\n` +
        `Respuesta recibida: ${content.slice(0, 500)}`
    );
  }

  return validado.data;
}

// ── Verificar si watsonx está configurado ────────────────────────────────────

export function isWatsonxConfigured(): boolean {
  return !!(
    process.env.WATSONX_API_KEY &&
    process.env.WATSONX_INSTANCE_URL &&
    process.env.WATSONX_AGENT_ID
  );
}
