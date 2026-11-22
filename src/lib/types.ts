import { z } from "zod";

// ── Negocio encontrado en OpenStreetMap ───────────────────────────────────────

export const negocioEncontradoSchema = z.object({
  fuente: z.enum(["osm", "denue"]),
  id: z.string().max(300),
  nombre: z.string().max(200),
  direccion: z.string().max(400),
  coloniaMapa: z.string().max(120).optional(), // nombre exacto de la colonia en el mapa
  categoria: z.string().max(120).optional(),
  especialidad: z.string().max(120).optional(), // p. ej. tipo de cocina
  marca: z.string().max(120).optional(),        // franquicia o cadena
  tamano: z.string().max(60).optional(),        // estrato de personal del DENUE, p. ej. "0 a 5 personas"
  lat: z.number().optional(),
  lng: z.number().optional(),
  sitioWeb: z.string().max(400).optional(),
  telefono: z.string().max(60).optional(),
  redesSociales: z.array(z.string().max(400)).max(4).optional(),
  horarios: z.array(z.string().max(200)).max(7).optional(),
  urlMapa: z.string().max(400).optional(),
});

export type NegocioEncontrado = z.infer<typeof negocioEncontradoSchema>;

/** Resultado de /api/negocios/buscar */
export interface ResultadoBusqueda {
  negocio: NegocioEncontrado;
  giroSugerido?: string;
  coloniaSugerida?: string;
}

/** Campos del formulario que la investigación automática puede llenar */
export type CampoInvestigable = "descripcionNegocio" | "modeloNegocio" | "giroComercial" | "aniosEnOperacion" | "numEmpleados";

/** Resultado de /api/negocios/investigar */
export interface InvestigacionNegocio {
  negocio: NegocioEncontrado;
  sugerencias: Partial<Record<CampoInvestigable, string>>;
  /** Lo que se encontró, en frases cortas para mostrar al usuario */
  hallazgos: string[];
  fuentes: { nombre: string; url: string }[];
  generadoPorIA: boolean;
}

// ── Formulario ────────────────────────────────────────────────────────────────

const camposFormulario = z.object({
  // Paso 0 - Perfil
  tipoPerfil: z.enum(["nuevo", "establecido"], { error: "Elige tu perfil" }),
  // Solo negocio establecido: cómo se capturaron sus datos
  fuenteDatosNegocio: z.enum(["manual", "busqueda"]).optional(),
  negocioEncontrado: negocioEncontradoSchema.optional(),

  // Paso 1 - Tipo de negocio
  giroComercial: z.string().min(1, "Selecciona un giro comercial"),
  nombreNegocio: z.string().min(2, "Ingresa el nombre de tu negocio").max(80),
  descripcionNegocio: z
    .string()
    .min(20, "Describe tu negocio en al menos 20 caracteres")
    .max(500),
  modeloNegocio: z.string().min(1, "Selecciona un modelo de negocio"),

  // Paso 2 - Ubicación (fija en Tijuana, B.C. — se inyecta en defaultValues)
  estado: z.string(),
  municipio: z.string(),
  colonia: z.string().min(1, "Selecciona la colonia o zona"),
  tieneLocal: z.enum(["si", "no", "virtual"], {
    error: "Indica si tienes local físico",
  }),

  // Paso 3 - Finanzas
  capitalDisponible: z.string().min(1, "Selecciona el rango de capital"),
  requiereFinanciamiento: z.boolean(),
  montoFinanciamiento: z.string().optional(),
  // Emprendedor: ventas estimadas · Establecido: ventas promedio actuales
  ventasMensualesEstimadas: z
    .string()
    .min(1, "Indica tus ventas mensuales"),

  // Paso 4 - Operación
  numEmpleados: z.string().min(1, "Selecciona el número de empleados"),
  experienciaPrevia: z.string().min(1, "Selecciona tu experiencia"),
  yaOpera: z.boolean(),
  aniosEnOperacion: z.string().optional(),
  // Solo negocio establecido
  situacionFormal: z.string().optional(),
  retoPrincipal: z.string().optional(),

  // Campos que se llenaron con la investigación automática (para marcarlos en la UI)
  camposAutollenados: z.array(z.string().max(40)).max(10).optional(),
});

/** Campos que solo son obligatorios para un negocio establecido. */
export function validarCamposEstablecido(
  datos: Partial<z.infer<typeof camposFormulario>>
): { campo: "aniosEnOperacion" | "situacionFormal" | "retoPrincipal"; mensaje: string }[] {
  if (datos.tipoPerfil !== "establecido") return [];
  const errores: ReturnType<typeof validarCamposEstablecido> = [];
  if (!datos.aniosEnOperacion) errores.push({ campo: "aniosEnOperacion", mensaje: "Indica cuánto tiempo lleva operando" });
  if (!datos.situacionFormal) errores.push({ campo: "situacionFormal", mensaje: "Indica la situación formal del negocio" });
  if (!datos.retoPrincipal) errores.push({ campo: "retoPrincipal", mensaje: "Elige tu reto principal" });
  return errores;
}

export const formularioSchema = camposFormulario.superRefine((datos, ctx) => {
  for (const e of validarCamposEstablecido(datos)) {
    ctx.addIssue({ code: "custom", path: [e.campo], message: e.mensaje });
  }
});

export type FormularioData = z.infer<typeof formularioSchema>;
export type TipoPerfil = FormularioData["tipoPerfil"];

export type PasoFormulario = {
  id: number;
  titulo: string;
  descripcion: string;
};

export type EstadoAnalisis =
  | "idle"
  | "cargando"
  | "completado"
  | "error";

export type CriterioViabilidad = {
  nombre: string;
  descripcion: string;
  puntaje: number;
};

export type TramiteRETyS = {
  nombre: string;
  dependencia: string;
  aplicabilidad: "CONFIRMADO" | "POSIBLEMENTE APLICABLE" | "NO CONFIRMADO" | "NO APLICABLE";
  costo: string;
  plazo: string;
};

export type ResultadoAnalisis = {
  // ── Campos heredados (compatibilidad con simulación) ──
  puntuacionViabilidad: number;
  nivelRiesgo: "bajo" | "medio" | "alto";
  resumenEjecutivo: string;
  recomendaciones: string[];
  alertas: string[];
  powerBiEmbedUrl?: string | null;

  // ── Campos del agente watsonx Orchestrate ──
  criterios?: CriterioViabilidad[];
  puntajeTotal?: number;        // 10–50 puntos (modelo de 10 criterios)
  clasificacion?: string;       // "Alta viabilidad estimada" | "Viabilidad con mejoras sugeridas" | "Requiere ajustes significativos"
  nivelConfianza?: string;      // "Alta confianza" | "Confianza media" | "Confianza limitada"
  fortalezas?: string[];
  riesgos?: string[];
  incertidumbres?: string[];
  tramitesIdentificados?: TramiteRETyS[];
  siguientesPasos?: string[];
  notaMetodologica?: string;
  fuenteAnalisis?: "agente_watsonx" | "simulacion";

  // ── Competencia cercana (OpenStreetMap) ──
  competencia?: CompetenciaZona;
};

export type CompetenciaZona = {
  fuente: "denue" | "osm";
  radioM: number;
  centro: { lat: number; lng: number; origen: "negocio" | "colonia" };
  total: number;
  /** Se alcanzó el máximo de resultados de alguna búsqueda: puede haber más */
  limiteAlcanzado: boolean;
  porTipo: { tipo: string; cantidad: number }[];
  cercanos: { nombre: string; tipo: string; distanciaM: number }[];
  /** Solo con DENUE: negocios similares por número de personas que trabajan */
  porTamano?: { tamano: string; cantidad: number }[];
};
