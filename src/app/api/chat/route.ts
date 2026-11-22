import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { buscarTramites, getTramitesByGiro, TramiteRETyS } from "@/lib/data/retys-index";
import { enviarMensajesAgente, getIamToken, isWatsonxConfigured, MensajeAgente } from "@/lib/watsonx";
import { obtenerIp, verificarLimite } from "@/lib/rate-limit";

/**
 * POST /api/chat
 *
 * Endpoint de los chats. Recibe { message, history, contexto? } y responde
 * con { reply, source }.
 *
 * Estrategia de 3 niveles:
 * 1. Agente de watsonx Orchestrate (base de conocimiento RETyS) → si está configurado
 * 2. watsonx.ai text generation → requiere WATSONX_PROJECT_ID
 * 3. Motor propio basado en el índice RETyS local → respaldo siempre disponible
 */

const chatRequestSchema = z.object({
  message: z.string().trim().min(1, "Mensaje vacío").max(1000, "El mensaje es demasiado largo (máx. 1000 caracteres)"),
  history: z
    .array(z.object({ rol: z.enum(["user", "agent"]), texto: z.string().max(4000) }))
    .max(50)
    .default([]),
  // Resumen del análisis realizado, para que el agente responda sobre ese negocio
  contexto: z.string().max(2000).optional(),
});

type MensajeHistorial = z.infer<typeof chatRequestSchema>["history"][number];

// ── Intento 1: agente de watsonx Orchestrate ──────────────────────────────────

async function tryOrchestrate(
  message: string,
  history: MensajeHistorial[],
  contexto?: string
): Promise<string | null> {
  if (!isWatsonxConfigured()) return null;

  const mensajes: MensajeAgente[] = history.slice(-10).map((m) => ({
    role: m.rol === "user" ? "user" : "assistant",
    content: m.texto,
  }));

  // Las instrucciones del agente piden JSON para el análisis; en el chat se
  // le pide explícitamente texto conversacional.
  const pregunta =
    (contexto ? `Contexto del análisis de mi negocio:\n${contexto}\n\n` : "") +
    `Pregunta: ${message}\n\n` +
    "Responde en español, en texto conversacional breve (no JSON). " +
    "Si mencionas trámites, usa la información del RETyS y no inventes requisitos.";
  mensajes.push({ role: "user", content: pregunta });

  try {
    const reply = await enviarMensajesAgente(mensajes, 45000);
    return reply.trim() || null;
  } catch (error) {
    console.error("Chat: agente de Orchestrate no disponible:", error);
    return null;
  }
}

// ── IAM token (compartido con src/lib/watsonx.ts) ─────────────────────────────

async function getIamTokenOpcional(): Promise<string | null> {
  if (!process.env.WATSONX_API_KEY || !process.env.WATSONX_PROJECT_ID) return null;
  try {
    return await getIamToken();
  } catch {
    return null;
  }
}

// ── Intento 2: watsonx.ai text generation (si hay WATSONX_PROJECT_ID) ────────

const SYSTEM_PROMPT = `Eres el Asesor de Viabilidad PYME para Tijuana, Baja California.
Especializad@ en emprendimiento, trámites del RETyS y análisis de viabilidad (10 criterios/50 puntos).
Responde siempre en español. Sé directo, práctico y sin inventar información.
No confirmes trámites como obligatorios sin evidencia oficial del RETyS.`;

async function tryWatsonxAI(
  message: string,
  history: MensajeHistorial[],
  token: string
): Promise<string | null> {
  const projectId = process.env.WATSONX_PROJECT_ID;
  const region = process.env.WATSONX_REGION ?? "au-syd";
  if (!projectId) return null;

  const historyText = history
    .slice(-6)
    .map((m) => `${m.rol === "user" ? "Usuario" : "Asesor"}: ${m.texto}`)
    .join("\n");

  const prompt = `${SYSTEM_PROMPT}\n\n${historyText ? `Conversación previa:\n${historyText}\n\n` : ""}Usuario: ${message}\nAsesor:`;

  try {
    const res = await fetch(
      `https://${region}.ml.cloud.ibm.com/ml/v1/text/generation?version=2023-05-29`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model_id: "ibm/granite-3-8b-instruct",
          input: prompt,
          parameters: { max_new_tokens: 800, temperature: 0.3, stop_sequences: ["\nUsuario:"] },
          project_id: projectId,
        }),
        signal: AbortSignal.timeout(30000),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.results?.[0]?.generated_text?.trim() ?? null;
  } catch {
    return null;
  }
}

// ── Motor de respuesta propio ─────────────────────────────────────────────────

function norm(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function formatTramitesList(tramites: TramiteRETyS[]): string {
  if (tramites.length === 0) return "";
  return tramites
    .map(
      (t, i) =>
        `${i + 1}. **${t.nombre}**\n   📍 ${t.dependencia}\n   💰 ${t.costo} · ⏱ ${t.plazo}\n   🔗 ${t.url}`
    )
    .join("\n\n");
}

type IntentKey =
  | "tramites_giro"
  | "tramites_general"
  | "retys_info"
  | "viabilidad_criterios"
  | "financiamiento"
  | "ecosistema"
  | "regimen_fiscal"
  | "uso_suelo"
  | "alcohol"
  | "alimentos_salud"
  | "sare"
  | "imss_sat"
  | "greeting"
  | "unknown";

function detectIntent(msg: string): IntentKey {
  const m = norm(msg);

  // Los temas específicos van antes que la regla genérica de trámites, que
  // de otro modo captura palabras como "registro" o "licencia".
  // \b evita coincidencias parciales (p. ej. "bar" en "barato", "sat" en "satisfecho").
  if (/\b(retys|registro estatal)\b/.test(m)) return "retys_info";
  if (/\bsare\b/.test(m)) return "sare";
  if (/\b(uso de suelo|zonificacion|zoning)\b/.test(m)) return "uso_suelo";
  if (/\b(alcohol|alcoholicas?|cervezas?|vinos?|bar|bares|cantinas?|licor(es)?)\b/.test(m)) return "alcohol";
  if (/(tramite|permiso|licencia|autorizacion|\bregistro\b|aviso de funcionamiento)/.test(m)) {
    // ¿pregunta por giro específico?
    if (/\b(para|abrir|apertura|mi negocio|negocio de|giro)\b/.test(m)) return "tramites_giro";
    return "tramites_general";
  }
  if (/(viabilidad|criterio|puntuacion|evalua|analiz)/.test(m)) return "viabilidad_criterios";
  if (/(financiamiento|credito|prestamo|\bnafin\b|fondo pyme|\bapoyos?\b|\bcapital\b|inversion)/.test(m)) return "financiamiento";
  if (/(ecosistema|incubadora|aceleradora|\bgeial\b|\basem\b|\bcdt\b|startups?|emprendedor)/.test(m)) return "ecosistema";
  if (/(\bresico\b|regimen|\bsat\b|\brfc\b|impuesto|factura|contribuyente|\biva\b)/.test(m)) return "regimen_fiscal";
  if (/\b(local|inmueble)\b/.test(m)) return "uso_suelo";
  if (/(alimento|comida|restaurante|taqueria|cocina|sanitari|coepris|cofepris)/.test(m)) return "alimentos_salud";
  if (/(\bimss\b|seguro social|trabajadores|nomina|infonavit)/.test(m)) return "imss_sat";
  if (/\b(hola|buenos|buenas|saludos|gracias|ayuda)\b/.test(m)) return "greeting";

  return "unknown";
}

function extractGiro(msg: string): string {
  const m = norm(msg);
  const girosKnown = [
    "restaurante", "taqueria", "loncheria", "fonda", "cafeteria", "panaderia",
    "tortilleria", "carniceria", "purificadora", "peluqueria", "salon de belleza",
    "spa", "mariscos", "farmacia", "clinica", "consultorio", "medico",
    "bar", "cantina", "tienda", "abarrotes", "ferreteria", "taller", "mecanico",
    "lavanderia", "imprenta", "manufactura", "maquiladora", "gym", "gimnasio",
    "escuela", "guarderia", "salon de eventos", "hotel", "hostal",
  ];
  for (const g of girosKnown) {
    if (m.includes(g)) return g;
  }
  // Intentar extraer sustantivo después de "para" / "de" / "mi"
  const match = m.match(/(?:para|de|mi|negocio de)\s+([\w\s]{3,30})/);
  if (match) return match[1].trim();
  return "";
}

function buildReply(intent: IntentKey, msg: string): string {
  switch (intent) {
    case "greeting":
      return `¡Hola! Soy el **Asesor PYME Tijuana**, especializado en:

• **Trámites RETyS** — 242 fichas oficiales de Baja California
• **Análisis de viabilidad** — modelo 10 criterios / 50 puntos
• **Financiamiento** — NAFIN, Fondo PyME B.C., Mujeres PyME
• **Ecosistema** — GEIAL, CDT, ASEM, UABC, CETYS
• **Regulación** — COEPRIS, Ayuntamiento Tijuana, SAT, IMSS

¿En qué puedo ayudarte hoy?`;

    case "tramites_giro": {
      const giro = extractGiro(msg);
      const tramites = giro ? getTramitesByGiro(giro) : buscarTramites(msg, { maxResultados: 5 });
      const giroLabel = giro ? ` para **${giro}**` : "";

      if (tramites.length === 0) {
        return `No encontré trámites específicos con esa búsqueda. ¿Puedes decirme más sobre tu giro comercial? Por ejemplo: "¿Qué trámites necesito para abrir una taquería en Tijuana?"`;
      }

      return `Aquí están los **trámites clave del RETyS**${giroLabel} en Tijuana / Baja California:

${formatTramitesList(tramites)}

---
⚠️ **Importante:** Verifica cada trámite directamente con la dependencia correspondiente — los requisitos y costos pueden cambiar. Consulta el RETyS oficial: https://retys.bajacalifornia.gob.mx

¿Quieres información detallada de alguno de estos trámites?`;
    }

    case "tramites_general": {
      const tramites = buscarTramites(msg, { maxResultados: 5 });
      const extra = tramites.length > 0
        ? `\n\nBasado en tu pregunta, estos trámites podrían ser relevantes:\n\n${formatTramitesList(tramites)}`
        : "";

      return `Los **trámites esenciales para abrir un negocio en Tijuana** son:

**1. Obligatorios desde el inicio:**
• RFC ante el SAT (gratuito, en línea)
• Uso de Suelo — Ayuntamiento Tijuana
• Licencia de Funcionamiento Municipal — Ayuntamiento Tijuana
• Visto Bueno de Protección Civil Municipal

**2. Para giros con alimentos/bebidas:**
• Aviso de Funcionamiento (COEPRIS) — gratuito, en línea

**3. Si tienes empleados:**
• Alta patronal en el IMSS
• Registro en INFONAVIT

**4. Vía rápida (bajo riesgo):**
• SARE Tijuana — apertura en 72 horas para giros de bajo riesgo${extra}

🔗 Consulta el RETyS completo: https://retys.bajacalifornia.gob.mx
🔗 Trámites Ayuntamiento Tijuana: https://tramites.tijuana.gob.mx

¿Cuál es tu giro comercial? Te doy la lista específica.`;
    }

    case "retys_info":
      return `El **RETyS** (Registro Estatal de Trámites y Servicios de Baja California) es el catálogo oficial de todos los trámites gubernamentales del estado.

**Contiene:**
• 242 trámites organizados por dependencia
• Trámites COEPRIS (salud y alimentos)
• Trámites SEPESCA, SPA, Protección Civil estatal
• Trámites municipales de Tijuana, Mexicali, Ensenada, Tecate, Playas de Rosarito

**Acceso directo:**
🔗 https://retys.bajacalifornia.gob.mx

**Dependencias principales en RETyS:**
• COEPRIS — Salud y establecimientos de alimentos
• SEPESCA — Pesca y acuacultura
• SPA — Protección al ambiente
• CEJUM — Atención a mujeres

¿Qué tipo de negocio tienes? Te digo qué trámites del RETyS aplican específicamente.`;

    case "viabilidad_criterios":
      return `El **Modelo de Evaluación de Viabilidad** usa **10 criterios / 50 puntos** (1–5 pts c/u):

| # | Criterio | Qué evalúa |
|---|---|---|
| 1 | Regulaciones y Legalidad | Trámites RETyS, permisos, complejidad regulatoria |
| 2 | Problema y Necesidad | Existencia y tamaño del problema de mercado |
| 3 | Propuesta de Valor | Diferenciación real frente a competidores |
| 4 | Demografía y Demanda | Tamaño de mercado, segmento objetivo en Tijuana |
| 5 | Actividad Económica Similar | Competencia existente (DENUE/INEGI) |
| 6 | Infraestructura y Recursos | Acceso a proveedores, local, tecnología |
| 7 | Viabilidad Financiera | Capital, costos, punto de equilibrio |
| 8 | Equipo y Gestión | Experiencia del emprendedor |
| 9 | Sostenibilidad | Recurrencia, retención, resistencia |
| 10 | Estrategia de Crecimiento | Escalabilidad, expansión binacional |

**Clasificación:**
• 45–50 pts → Alta viabilidad estimada
• 35–44 pts → Viabilidad con mejoras sugeridas
• < 35 pts → Requiere ajustes significativos

¿Quieres que analicemos tu idea de negocio con este modelo? Usa el **formulario de análisis** para un diagnóstico completo.`;

    case "financiamiento":
      return `**Programas de financiamiento para PyMEs en Tijuana / Baja California:**

**Nacional (NAFIN):**
• Crédito PyME — desde $50,000 MXN · tasa preferencial
• Cadenas Productivas — factoraje para proveedores
• Mujeres PyME — para emprendedoras
🔗 https://www.nafin.com

**Estatal (Baja California):**
• Fondo PyME B.C. — apoyos no reembolsables y créditos blandos
• Programa Semilla — para startups en etapa temprana
🔗 https://sde.bajacalifornia.gob.mx

**Tijuana:**
• CDT Tijuana — aceleración + capital seed
• GEIAL — mentorías y conexión con inversores
🔗 https://cdt.org.mx

**Federal:**
• INADEM / Fondo Nacional Emprendedor — convocatorias anuales
• Crédito Joven — para emprendedores < 35 años

**Recomendación:** Con capital < $100k MXN, considera el modelo SARE + RESICO primero para formalizar sin costo antes de buscar financiamiento.

¿Cuánto capital necesitas y en qué etapa está tu negocio?`;

    case "ecosistema":
      return `El ecosistema emprendedor de **Tijuana** es uno de los más activos de México:

**Organizaciones clave:**
• **GEIAL** — ecosistema de innovación, mentorías, red emprendedora
• **CDT Tijuana** — Centro de Diseño y Tecnología, aceleración, demos
• **ASEM B.C.** — Asociación de Emprendedores de México
• **Baja California Innovation Hub** — startups deeptech
• **UABC** — incubadora universitaria más grande de B.C.
• **CETYS Universidad** — incubadora focalizada en innovación
• **COLEF** — investigación económica y fronteriza

**Clusters fuertes en Tijuana:**
🏭 Manufactura y maquiladoras (Zona Industrial El Florido, La Mesa)
💊 Dispositivos médicos (clúster médico más grande de Latam)
💻 Software y servicios digitales (corredor tecnológico)
🌊 Agroindustria y pesca (Ensenada/Tijuana)

**Ventaja binacional:**
El mercado San Diego–Tijuana tiene un PIB combinado de ~$250 mil MDD. Acceso a talento, distribución y clientes de ambos lados.

¿Qué tipo de negocio quieres abrir? Te conecto con los recursos más relevantes.`;

    case "regimen_fiscal":
      return `**Regímenes fiscales para tu negocio en México (SAT 2024):**

**RESICO — Régimen Simplificado de Confianza** ⭐ Recomendado para PyMEs
• Para persona física con ingresos anuales ≤ $3.5M MXN
• Tasa: 1% a 2.5% sobre ingresos (muy baja)
• Sin contabilidad formal obligatoria
• Facturación simple
🔗 https://www.sat.gob.mx/consulta/91080/

**Persona Física con Actividad Empresarial**
• Para ingresos > $3.5M o con múltiples actividades
• ISR escalonado hasta 35% sobre utilidad
• Requiere contador

**Persona Moral (SA de CV, SAS)**
• Para socios o proyectos más complejos
• SAS (Sociedad por Acciones Simplificada) — costo de constitución mínimo, en línea
• ISR corporativo: 30%

**Pasos para darte de alta:**
1. Genera tu RFC en sat.gob.mx (gratis, en línea)
2. Elige régimen RESICO si calificas
3. Activa tu e.firma (FIEL)
4. Emite tu primera factura digital (CFDI)

¿Cuánto esperas facturar al mes? Te digo qué régimen te conviene.`;

    case "uso_suelo": {
      const tramites = getTramitesByGiro("uso de suelo").slice(0, 2);
      return `El **Certificado de Uso de Suelo** es fundamental antes de firmar cualquier contrato de renta en Tijuana.

**¿Qué es?**
Documento que confirma que tu actividad comercial está permitida en esa ubicación según el Plan de Desarrollo Urbano.

**¿Dónde tramitarlo?**
• Dirección de Urbanismo — Ayuntamiento de Tijuana
🔗 https://tramites.tijuana.gob.mx
• Plazo: 5–10 días hábiles
• Costo: consultar tarifario vigente

**Consejos:**
• Pídelo ANTES de firmar el contrato de renta
• Verifica que el giro esté en la clasificación correcta (comercio/servicios/industria)
• Las zonas de uso mixto (H3, C3) suelen ser las más flexibles
• La Zona Río y el Centro Histórico tienen restricciones especiales

${tramites.length > 0 ? `**Trámites relacionados:**\n${formatTramitesList(tramites)}` : ""}

¿Tienes ya un local específico en mente? Te ayudo con la verificación.`;
    }

    case "alcohol": {
      const tramites = buscarTramites("alcohol licencia", { maxResultados: 3 });
      return `Vender **bebidas alcohólicas** en Tijuana requiere trámites adicionales y es uno de los permisos más complejos:

**Trámites necesarios:**
${formatTramitesList(tramites)}

**Consideraciones importantes:**
⚠️ La licencia de alcohol del Ayuntamiento de Tijuana puede costar entre $15,000 y $80,000 MXN (según modalidad) y tomar 1–3 meses.
⚠️ Existen zonas restringidas (cerca de escuelas, hospitales, iglesias).
⚠️ Se requiere Protección Civil municipal aprobado.
⚠️ Los bares, cantinas y restaurantes con alcohol tienen diferentes categorías de licencia.
⚠️ El permiso de publicidad de bebidas alcohólicas es separado (COEPRIS).

**Modalidades de licencia:**
• Restaurante-bar (con alimentos)
• Cantina o bar (sin obligación de alimentos)
• Tienda de conveniencia / off (venta cerrada)
• Importador / distribuidor

¿Qué tipo de establecimiento vas a abrir?`;
    }

    case "alimentos_salud": {
      const tramites = getTramitesByGiro("restaurante");
      return `Para negocios de **alimentos y bebidas** en Tijuana, el trámite clave es el **Aviso de Funcionamiento de COEPRIS** — es gratuito y en línea:

${formatTramitesList(tramites.slice(0, 4))}

**Requisitos típicos del Aviso COEPRIS:**
• Formato de autorizaciones debidamente requisitado
• Identificación oficial (INE)
• Comprobante de pago (si aplica)
• Acta de nacimiento

**Pasos:**
1. Ingresa a DIGIPRIS: https://digipris.bajacalifornia.gob.mx
2. Selecciona "Aviso de Funcionamiento"
3. Llena el formato en línea
4. Firma la resolución enviada por correo

**Para giros de alto riesgo sanitario** (mariscos, carnes, lácteos):
Puede requerirse capacitación en manejo higiénico de alimentos para todo el personal.

¿Qué tipo de alimentos vas a preparar o vender?`;
    }

    case "sare":
      return `El **SARE** (Sistema de Apertura Rápida de Empresas) en Tijuana permite abrir un negocio de **bajo riesgo en 72 horas**.

**¿Qué incluye el SARE?**
En un solo trámite integrado:
• Licencia de Funcionamiento Municipal
• Aviso de Funcionamiento (si aplica)
• Certificación ante el SAT
• Alta en el IMSS (orientación)

**¿Qué giros califican para el SARE?**
Negocios de bajo riesgo sanitario y de seguridad, como:
• Tiendas de abarrotes / misceláneas
• Papelerías
• Consultorios médicos o dentales pequeños
• Estéticas y salones de belleza
• Talleres de reparación menores
• Servicios profesionales sin público masivo

**¿Dónde tramitarlo?**
🔗 https://tramites.tijuana.gob.mx/sare
📍 Palacio Municipal de Tijuana

**Costo:** Mínimo o sin costo para giros elegibles.

⚠️ Los giros de alto riesgo (venta de alcohol, establecimientos de salud complejos, industria) NO califican para el SARE.

¿Cuál es tu giro? Te digo si califica para el SARE.`;

    case "imss_sat":
      return `**Obligaciones fiscales y laborales básicas para tu negocio:**

**SAT — Registro:**
• RFC: gratuito en línea → https://sat.gob.mx
• e.firma (FIEL): necesaria para facturar y trámites digitales
• CFDI: cada venta mayor a $600 requiere factura digital

**IMSS — Si tienes empleados:**
• Inscripción patronal: gratuita, en línea → https://imss.gob.mx
• Cuotas: ~25–35% del salario (patrón) + ~8% (trabajador)
• Alta de cada trabajador: dentro de los primeros 5 días

**INFONAVIT:**
• Registro automático al darte de alta en IMSS
• Aportación: 5% del salario

**Plazos importantes:**
⏱ RFC → antes de iniciar operaciones
⏱ IMSS → primeros 5 días de contratar
⏱ Declaraciones mensuales RESICO → día 17 de cada mes

**Herramienta útil:** Usa la aplicación **"SAT Móvil"** para emitir facturas desde tu teléfono.

¿Tienes empleados o trabajas solo (persona física)?`;

    default:
      return buildUnknownReply(msg);
  }
}

function buildUnknownReply(msg: string): string {
  // Intentar búsqueda en RETyS antes de respuesta genérica
  const tramites = buscarTramites(msg, { maxResultados: 3 });

  if (tramites.length > 0) {
    return `Encontré estos trámites del **RETyS Baja California** relacionados con tu consulta:

${formatTramitesList(tramites)}

¿Es esto lo que buscabas? Puedo darte más detalles sobre cualquiera de estos trámites, o pregúntame sobre:
• Trámites específicos para tu giro
• Análisis de viabilidad
• Financiamiento y apoyos
• Ecosistema emprendedor de Tijuana`;
  }

  return `Soy el **Asesor PYME Tijuana**. Puedo ayudarte con:

• 📋 **Trámites RETyS** — "¿Qué permisos necesito para abrir una taquería?"
• 📊 **Viabilidad** — "¿Qué tan viable es mi idea de negocio?"
• 💰 **Financiamiento** — "¿Cómo puedo conseguir crédito para mi negocio?"
• 🏙️ **Ecosistema** — "¿Qué incubadoras hay en Tijuana?"
• 📝 **SAT/IMSS** — "¿En qué régimen debo darme de alta?"
• 🏘️ **Uso de suelo** — "¿Puedo poner mi negocio en esta colonia?"

¿Puedes reformular tu pregunta?`;
}

// ── POST handler ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Máx. 30 mensajes por IP cada 5 minutos
  const espera = verificarLimite(`chat:${obtenerIp(req)}`, 30, 5 * 60_000);
  if (espera > 0) {
    return NextResponse.json(
      { error: `Demasiados mensajes seguidos. Intenta de nuevo en ${espera} s.` },
      { status: 429, headers: { "Retry-After": String(espera) } }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "El cuerpo de la solicitud no es JSON válido." }, { status: 400 });
  }

  const validacion = chatRequestSchema.safeParse(body);
  if (!validacion.success) {
    return NextResponse.json(
      { error: validacion.error.issues[0]?.message ?? "Solicitud inválida." },
      { status: 400 }
    );
  }
  const { message, history, contexto } = validacion.data;

  try {
    // Intento 1: agente de Orchestrate (con las fichas RETyS de su base de conocimiento)
    const agentReply = await tryOrchestrate(message, history, contexto);
    if (agentReply) {
      return NextResponse.json({ reply: agentReply, source: "agente_watsonx" });
    }

    // Intento 2: watsonx.ai (si hay WATSONX_PROJECT_ID configurado)
    const token = await getIamTokenOpcional();
    if (token) {
      const wxaiReply = await tryWatsonxAI(message, history, token);
      if (wxaiReply) {
        return NextResponse.json({ reply: wxaiReply, source: "watsonx_ai" });
      }
    }

    // Intento 3: motor propio con el índice RETyS local
    const intent = detectIntent(message);
    const reply = buildReply(intent, message);

    return NextResponse.json({ reply, source: "retys_engine" });
  } catch (error) {
    console.error("Error en /api/chat:", error);
    return NextResponse.json(
      { error: "Error al procesar el mensaje." },
      { status: 500 }
    );
  }
}
