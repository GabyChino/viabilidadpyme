import { NextRequest, NextResponse } from "next/server";
import { CompetenciaZona, FormularioData, ResultadoAnalisis, formularioSchema } from "@/lib/types";
import { analizarCompetencia } from "@/lib/competencia";
import { registrarMetrica } from "@/lib/metricas";
import {
  callViabilidadAgent,
  clasificarPuntaje,
  isWatsonxConfigured,
  WatsonxAgentResponse,
} from "@/lib/watsonx";
import { obtenerIp, verificarLimite } from "@/lib/rate-limit";

/**
 * POST /api/analizar
 *
 * Recibe los datos del formulario y:
 * - Si watsonx Orchestrate está configurado → llama al agente real
 * - Si no → usa la simulación de respaldo (dev/staging sin credenciales)
 *
 * El agente usa los prompts de PROMPTS/ y la knowledge base RETyS
 * para generar el análisis completo de viabilidad (10 criterios / 50 pts).
 */
export async function POST(req: NextRequest) {
  // Cada análisis consume créditos de watsonx: máx. 10 por IP cada 10 minutos
  const espera = verificarLimite(`analizar:${obtenerIp(req)}`, 10, 10 * 60_000);
  if (espera > 0) {
    return NextResponse.json(
      { error: `Has hecho demasiados análisis seguidos. Intenta de nuevo en ${Math.ceil(espera / 60)} min.` },
      { status: 429, headers: { "Retry-After": String(espera) } }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "El cuerpo de la solicitud no es JSON válido." }, { status: 400 });
  }

  const validacion = formularioSchema.safeParse(body);
  if (!validacion.success) {
    return NextResponse.json(
      { error: "Datos del formulario inválidos.", detalle: validacion.error.issues },
      { status: 400 }
    );
  }
  const datos = validacion.data;

  const inicio = Date.now();
  const medir = (fuente: string) =>
    registrarMetrica("analisis", {
      fuente,
      perfil: datos.tipoPerfil,
      giro: datos.giroComercial,
      desdeMapa: !!datos.negocioEncontrado,
      ms: Date.now() - inicio,
    });

  try {
    const competencia = await obtenerCompetencia(datos);

    if (isWatsonxConfigured()) {
      // ── Ruta real: agente IBM watsonx Orchestrate ──────────────────────────
      try {
        const agentResponse = await callViabilidadAgent(datos, competencia);
        medir("agente_watsonx");
        return NextResponse.json({ ...mapAgentResponseToResultado(agentResponse), competencia: competencia ?? undefined });
      } catch (agentError) {
        // Si el agente falla, se responde con la simulación en vez de un 500
        console.error("Agente watsonx no disponible, usando simulación:", agentError);
        const resultado = generarRespuestaSimulada(datos, competencia);
        resultado.notaMetodologica =
          "⚠️ El agente IBM watsonx Orchestrate no respondió correctamente, por lo que se muestra un " +
          "análisis de respaldo con datos simulados. Intenta de nuevo más tarde para obtener el análisis completo.";
        medir("simulacion_por_fallo");
        return NextResponse.json(resultado);
      }
    }

    // ── Ruta de respaldo: simulación para desarrollo ─────────────────────────
    await new Promise((res) => setTimeout(res, 2500));
    medir("simulacion_sin_credenciales");
    return NextResponse.json(generarRespuestaSimulada(datos, competencia));
  } catch (error) {
    console.error("Error en /api/analizar:", error);
    medir("error");

    const message =
      error instanceof Error ? error.message : "Error desconocido";

    return NextResponse.json(
      {
        error: "Error al procesar el análisis. Intenta de nuevo.",
        detalle: process.env.NODE_ENV === "development" ? message : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * Competencia cercana (DENUE u OpenStreetMap). Es complementaria: si tarda
 * o falla, el análisis sigue sin ella.
 */
async function obtenerCompetencia(datos: FormularioData): Promise<CompetenciaZona | null> {
  const inicio = Date.now();
  try {
    const competencia = await Promise.race([
      analizarCompetencia(datos),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 20_000)),
    ]);
    registrarMetrica("competencia", { fuente: competencia?.fuente ?? null, total: competencia?.total, ms: Date.now() - inicio });
    return competencia;
  } catch (error) {
    console.warn("No se pudo calcular la competencia cercana:", error);
    registrarMetrica("competencia", { fuente: null, error: true, ms: Date.now() - inicio });
    return null;
  }
}

// ── Mapeo: respuesta del agente → ResultadoAnalisis ───────────────────────────

function mapAgentResponseToResultado(
  agent: WatsonxAgentResponse
): ResultadoAnalisis {
  // Convierte puntajeTotal (0-50) a puntuacionViabilidad (0-100) para el gauge
  const puntuacion100 = Math.round((agent.puntajeTotal / 50) * 100);
  const nivelRiesgo =
    puntuacion100 >= 70 ? "bajo" : puntuacion100 >= 40 ? "medio" : "alto";

  return {
    // Campos de compatibilidad con el gauge y componentes existentes
    puntuacionViabilidad: puntuacion100,
    nivelRiesgo,
    resumenEjecutivo: agent.resumenEjecutivo,
    recomendaciones: agent.siguientesPasos,
    alertas: agent.riesgos,
    powerBiEmbedUrl: null,

    // Campos enriquecidos del agente
    criterios: agent.criterios,
    puntajeTotal: agent.puntajeTotal,
    clasificacion: agent.clasificacion,
    nivelConfianza: agent.nivelConfianza,
    fortalezas: agent.fortalezas,
    riesgos: agent.riesgos,
    incertidumbres: agent.incertidumbres,
    tramitesIdentificados: agent.tramitesIdentificados,
    siguientesPasos: agent.siguientesPasos,
    notaMetodologica: agent.notaMetodologica,
    fuenteAnalisis: "agente_watsonx",
  };
}

// ── Simulación (respaldo para desarrollo sin credenciales) ────────────────────

function generarRespuestaSimulada(datos: FormularioData, competencia: CompetenciaZona | null): ResultadoAnalisis {
  const esEstablecido = datos.tipoPerfil === "establecido";
  const mapa = datos.negocioEncontrado;

  // Criterios simulados a partir de los datos declarados (y del mapa, si hay)
  const criteriosSimulados = [
    {
      nombre: "Regulaciones y Legalidad",
      descripcion: esEstablecido
        ? `Situación declarada: ${datos.situacionFormal ?? "sin dato"}; verificar trámites faltantes en RETyS.`
        : "Trámites RETyS pendientes de verificar con autoridad competente.",
      puntaje: esEstablecido ? ({ formal: 5, parcial: 3, informal: 2 }[datos.situacionFormal ?? ""] ?? 3) : 3,
    },
    {
      nombre: "Problema y Necesidad del Mercado",
      descripcion: esEstablecido ? "El negocio ya tiene clientes; falta medir la demanda de crecimiento." : "Necesidad plausible; requiere validación de demanda local.",
      puntaje: esEstablecido ? 4 : 3,
    },
    { nombre: "Propuesta de Valor y Diferenciación", descripcion: "Propuesta identificable; diferenciación por confirmar.", puntaje: 3 },
    { nombre: "Demografía y Demanda de Mercado", descripcion: "Tijuana ofrece mercado activo; datos específicos pendientes.", puntaje: 3 },
    criterioCompetencia(competencia),
    {
      nombre: "Infraestructura y Recursos Clave",
      descripcion: esEstablecido ? "Ya cuenta con operación e infraestructura en marcha." : "Recursos básicos disponibles en Tijuana.",
      puntaje: esEstablecido ? 4 : 3,
    },
    { nombre: "Viabilidad Financiera", descripcion: "Capital indicado requiere validación del punto de equilibrio.", puntaje: calcularCriterioFinanciero(datos) },
    { nombre: "Equipo y Gestión", descripcion: "Experiencia en el sector según lo declarado.", puntaje: calcularCriterioEquipo(datos) },
    {
      nombre: "Sostenibilidad del Negocio",
      descripcion: esEstablecido ? `Opera desde hace ${(datos.aniosEnOperacion ?? "").replace(/_/g, " ")} año(s).` : "Sostenibilidad depende de demanda recurrente a confirmar.",
      puntaje: esEstablecido ? ({ menos_1: 3, "1_2": 3, "2_5": 4, mas_5: 5 }[datos.aniosEnOperacion ?? ""] ?? 3) : 3,
    },
    {
      nombre: "Estrategia de Crecimiento",
      descripcion: mapa && !mapa.sitioWeb ? "Sin sitio web registrado: oportunidad de presencia digital." : "Potencial de crecimiento en mercado binacional Tijuana–San Diego.",
      puntaje: 3,
    },
  ];

  // El total y la escala 0-100 salen de la suma de criterios, para que cuadren
  const puntaje50 = criteriosSimulados.reduce((acc, c) => acc + c.puntaje, 0);
  const puntuacion = Math.round((puntaje50 / 50) * 100);
  const nivelRiesgo =
    puntuacion >= 70 ? "bajo" : puntuacion >= 40 ? "medio" : "alto";

  const fortalezas = [
    "Tijuana cuenta con un ecosistema emprendedor activo (GEIAL, ASEM, CDT).",
    "El mercado binacional Tijuana–San Diego ofrece oportunidades únicas.",
  ];
  if (esEstablecido) fortalezas.unshift("El negocio ya opera: tiene clientes y experiencia real en el mercado.");

  return {
    puntuacionViabilidad: puntuacion,
    nivelRiesgo,
    resumenEjecutivo:
      `El análisis preliminar de "${datos.nombreNegocio}" en ${datos.municipio} muestra ` +
      `condiciones ${nivelRiesgo === "bajo" ? "favorables" : nivelRiesgo === "medio" ? "moderadas" : "desafiantes"}` +
      (esEstablecido ? " para su crecimiento. " : " para su apertura. ") +
      `Este resultado es una estimación de respaldo; el análisis completo lo genera el agente IA.`,
    recomendaciones: generarRecomendaciones(datos),
    alertas: generarAlertas(datos),
    powerBiEmbedUrl: null,

    // Datos del modelo de 10 criterios (simulados)
    criterios: criteriosSimulados,
    puntajeTotal: puntaje50,
    clasificacion: clasificarPuntaje(puntaje50),
    nivelConfianza: "Confianza limitada",
    fortalezas,
    riesgos: generarAlertas(datos),
    incertidumbres: [
      "Demanda real del segmento objetivo no validada.",
      "Trámites y permisos RETyS pendientes de verificación.",
      "Costos de operación y punto de equilibrio sin calcular.",
    ],
    tramitesIdentificados: [
      {
        nombre: "Aviso de Funcionamiento (COEPRIS)",
        dependencia: "COEPRIS — Comisión Estatal para la Protección contra Riesgos Sanitarios",
        aplicabilidad: "POSIBLEMENTE APLICABLE",
        costo: "Sin costo",
        plazo: "No especificado",
      },
      {
        nombre: "Licencia de Funcionamiento Municipal",
        dependencia: "Ayuntamiento de Tijuana",
        aplicabilidad: "POSIBLEMENTE APLICABLE",
        costo: "Variable según giro",
        plazo: "10–15 días hábiles",
      },
    ],
    siguientesPasos: generarRecomendaciones(datos).slice(0, 2),
    notaMetodologica:
      "⚠️ Análisis de respaldo generado sin el agente IBM watsonx Orchestrate. " +
      "Para el análisis completo con RETyS y el modelo de 10 criterios, configure las variables WATSONX_API_KEY, " +
      "WATSONX_INSTANCE_URL y WATSONX_AGENT_ID en .env.local.",
    fuenteAnalisis: "simulacion",
    competencia: competencia ?? undefined,
  };
}

// ── Funciones auxiliares de simulación ───────────────────────────────────────

/** Criterio 5 a partir del conteo de OpenStreetMap: más negocios similares cerca, más saturación. */
function criterioCompetencia(c: CompetenciaZona | null) {
  const nombre = "Actividad Económica Similar";
  if (!c) return { nombre, descripcion: "Sector con competencia existente en la zona.", puntaje: 3 };
  const cifra = `${c.total}${c.limiteAlcanzado ? " o más" : ""} negocios similares a menos de ${c.radioM} m (OpenStreetMap)`;
  if (c.total <= 2) return { nombre, descripcion: `${cifra}: poca competencia directa registrada.`, puntaje: 4 };
  if (c.total <= 9) return { nombre, descripcion: `${cifra}: competencia moderada.`, puntaje: 3 };
  return { nombre, descripcion: `${cifra}: zona con alta competencia; la diferenciación es clave.`, puntaje: 2 };
}

function calcularCriterioFinanciero(datos: FormularioData): number {
  const capitalMap: Record<string, number> = {
    menos_50k: 2, "50k_100k": 3, "100k_300k": 3, "300k_500k": 4, "500k_1m": 4, mas_1m: 5,
  };
  return capitalMap[datos.capitalDisponible] ?? 3;
}

function calcularCriterioEquipo(datos: FormularioData): number {
  const experienciaMap: Record<string, number> = {
    ninguna: 2, menos_1: 3, "1_3": 3, "3_5": 4, mas_5: 5,
  };
  return experienciaMap[datos.experienciaPrevia] ?? 3;
}

function generarRecomendaciones(datos: FormularioData): string[] {
  const recs: string[] = [];

  if (datos.experienciaPrevia === "ninguna" || datos.experienciaPrevia === "menos_1") {
    recs.push("Busca un mentor o socio con experiencia en el sector antes de invertir más.");
  }
  if (datos.capitalDisponible === "menos_50k" || datos.capitalDisponible === "50k_100k") {
    recs.push("Con capital limitado, considera un modelo de bajo costo inicial (home-based o pop-up).");
  }
  if (datos.tieneLocal === "si") {
    recs.push("Verifica que el local cuente con uso de suelo compatible en el Ayuntamiento de Tijuana.");
  }
  if (datos.tipoPerfil === "establecido") {
    const porReto: Record<string, string> = {
      formalizar: "Empieza por el RFC en RESICO y la licencia de funcionamiento municipal; son la base de los demás trámites.",
      aumentar_ventas: "Pide reseñas a tus clientes frecuentes y responde las existentes: mejoran tu visibilidad en mapas y buscadores.",
      financiamiento: "Reúne tus estados de cuenta y ventas de los últimos 6 meses: son lo primero que pide NAFIN o un banco.",
      expandir: "Antes de abrir otra sucursal, mide el margen por unidad y valida demanda en la nueva colonia.",
      reducir_costos: "Revisa tus 3 gastos más grandes y negocia con proveedores locales o compras en volumen.",
      digitalizar: "Activa pedidos por WhatsApp Business y completa la ficha de tu negocio en los mapas (Google Maps, OpenStreetMap) antes de invertir en tienda en línea.",
    };
    if (datos.retoPrincipal && porReto[datos.retoPrincipal]) recs.push(porReto[datos.retoPrincipal]);
    if (datos.negocioEncontrado && !datos.negocioEncontrado.sitioWeb && !datos.negocioEncontrado.redesSociales) {
      recs.push("Tu negocio no tiene sitio web ni redes registradas en el mapa: agrega al menos redes sociales o WhatsApp a tu ficha.");
    }
  } else if (datos.modeloNegocio === "b2c") {
    recs.push("Para B2C, registra tu negocio en Google My Business y activa redes sociales desde el día 1.");
  }
  if (!datos.requiereFinanciamiento && datos.capitalDisponible === "menos_50k") {
    recs.push("Explora programas NAFIN, Fondo PyME B.C. o Mujeres PYME para capital sin deuda.");
  }
  recs.push("Verifica los trámites aplicables en RETyS: https://retys.bajacalifornia.gob.mx");
  if (datos.tipoPerfil !== "establecido" || datos.situacionFormal !== "formal") {
    recs.push("Registra tu negocio en el SARE de Tijuana para agilizar la apertura formal.");
  }

  return recs;
}

function generarAlertas(datos: FormularioData): string[] {
  const alertas: string[] = [];

  if (datos.capitalDisponible === "menos_50k") {
    alertas.push("Capital muy limitado: el margen de error financiero es mínimo. Define un plan de contingencia.");
  }
  if (datos.requiereFinanciamiento) {
    alertas.push("El financiamiento externo incrementa el riesgo financiero. Asegura que el flujo cubra la deuda desde el primer trimestre.");
  }
  if (datos.experienciaPrevia === "ninguna") {
    alertas.push("Sin experiencia previa, la curva de aprendizaje puede impactar la rentabilidad inicial.");
  }
  if (datos.tipoPerfil === "establecido" && datos.situacionFormal === "informal") {
    alertas.push("Operar sin registros expone el negocio a multas o clausura y limita el acceso a crédito.");
  }
  if (datos.numEmpleados === "mas_30") {
    alertas.push("Alta carga de nómina desde el inicio. Considera una estructura más ágil para los primeros 6 meses.");
  }

  return alertas;
}
