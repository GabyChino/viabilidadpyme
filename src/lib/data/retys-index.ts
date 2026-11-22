/**
 * src/lib/data/retys-index.ts
 *
 * Índice en memoria de trámites clave para apertura de negocios (selección curada,
 * no las 242 fichas del RETyS que tiene la base de conocimiento del agente en Orchestrate).
 * Las entradas BC-* provienen de /knowledge RETYS/; las TIJ-*, SAT-*, IMSS-*, etc.
 * son trámites municipales/federales agregados manualmente (no están en el RETyS).
 *
 * Uso:
 *   import { buscarTramites } from "@/lib/data/retys-index";
 *   const tramites = buscarTramites("taquería", { maxResultados: 5 });
 */

export interface TramiteRETyS {
  id: string;
  nombre: string;
  dependencia: string;
  url: string;
  plazo: string;
  costo: string;
  keywords: string[];
}

// ── Índice de trámites relevantes para apertura de negocios ──────────────────
// Organizado por dependencia, con keywords para búsqueda semántica rápida

export const TRAMITES_RETYS: TramiteRETyS[] = [
  // ── COEPRIS (Salud) ───────────────────────────────────────────────────────
  {
    id: "BC-COEPRIS-001",
    nombre: "Aviso de Funcionamiento del Establecimiento de Productos y Servicios (COFEPRIS 05-018)",
    dependencia: "COEPRIS — Comisión Estatal para la Protección contra Riesgos Sanitarios",
    url: "https://retys.bajacalifornia.gob.mx/Portal/TyS/669?organismoId=56",
    plazo: "Inmediato (afirmativa ficta)",
    costo: "Sin costo",
    keywords: ["restaurante", "taquería", "lonchería", "fonda", "cocina", "carnicería", "panadería", "tortillería", "purificadora", "peluquería", "salón de belleza", "cafetería", "spa", "mariscos", "hot dogs", "nievería", "dulcería", "alimentos", "bebidas", "servicio sanitario"],
  },
  {
    id: "BC-COEPRIS-005",
    nombre: "Aviso de Funcionamiento de Farmacia Alopática o Farmacia Homeopática o Botica",
    dependencia: "COEPRIS — Comisión Estatal para la Protección contra Riesgos Sanitarios",
    url: "https://retys.bajacalifornia.gob.mx/Portal/TyS/681?organismoId=56",
    plazo: "1 día hábil",
    costo: "Sin costo",
    keywords: ["farmacia", "medicamentos", "botica", "homeopática", "alopática", "insumos para la salud"],
  },
  {
    id: "BC-COEPRIS-007",
    nombre: "Aviso de Funcionamiento de Establecimiento de Servicios de Salud (COFEPRIS-05-036)",
    dependencia: "COEPRIS — Comisión Estatal para la Protección contra Riesgos Sanitarios",
    url: "https://retys.bajacalifornia.gob.mx/Portal/TyS/686?organismoId=56",
    plazo: "1 minuto (en línea)",
    costo: "Sin costo",
    keywords: ["clínica", "consultorio", "médico", "laboratorio clínico", "hospital", "dentista", "odontología", "fisioterapia", "psicólogo", "salud", "servicios médicos"],
  },
  {
    id: "BC-COEPRIS-016",
    nombre: "Permiso Sanitario de Publicidad de Bebidas Alcohólicas",
    dependencia: "COEPRIS — Comisión Estatal para la Protección contra Riesgos Sanitarios",
    url: "https://retys.bajacalifornia.gob.mx/Portal/TyS/714?organismoId=56",
    plazo: "No especificado",
    costo: "Con costo (ver ficha)",
    keywords: ["alcohol", "cerveza", "vino", "bar", "cantina", "publicidad", "bebidas alcohólicas", "anuncios"],
  },
  {
    id: "BC-COEPRIS-018",
    nombre: "Licencia Sanitaria para Establecimiento de Plaguicidas y Fertilizantes",
    dependencia: "COEPRIS — Comisión Estatal para la Protección contra Riesgos Sanitarios",
    url: "https://retys.bajacalifornia.gob.mx/Portal/TyS/717?organismoId=56",
    plazo: "No especificado",
    costo: "Con costo (ver ficha)",
    keywords: ["plaguicidas", "fertilizantes", "agroquímicos", "fumigadora", "control de plagas"],
  },

  // ── SEMARNAT / Medio Ambiente BC ──────────────────────────────────────────
  {
    id: "BC-SEMARNAT-001",
    nombre: "Autorización de Impacto Ambiental para Establecimientos Comerciales e Industriales",
    dependencia: "SEMARNAT / Secretaría de Protección al Ambiente de B.C.",
    url: "https://retys.bajacalifornia.gob.mx",
    plazo: "60 días hábiles",
    costo: "Con costo (ver ficha)",
    keywords: ["impacto ambiental", "industria", "manufactura", "taller", "residuos", "contaminación", "emisiones", "gases"],
  },
  {
    id: "BC-SPA-001",
    nombre: "Autorización de Generación de Residuos de Manejo Especial",
    dependencia: "Secretaría de Protección al Ambiente de Baja California (SPA)",
    url: "https://retys.bajacalifornia.gob.mx",
    plazo: "30 días hábiles",
    costo: "Con costo (ver ficha)",
    keywords: ["residuos", "basura especial", "talleres", "imprentas", "lavanderías industriales", "manejo especial"],
  },

  // ── Protección Civil BC ───────────────────────────────────────────────────
  {
    id: "BC-PC-001",
    nombre: "Dictamen de Protección Civil para Establecimientos Comerciales",
    dependencia: "Coordinación Estatal de Protección Civil de Baja California",
    url: "https://retys.bajacalifornia.gob.mx",
    plazo: "15–30 días hábiles",
    costo: "Con costo (ver ficha)",
    keywords: ["protección civil", "dictamen", "seguridad", "incendio", "extintores", "evacuación", "local comercial", "establecimiento"],
  },

  // ── SEPESCA (Pesca y Acuacultura) ─────────────────────────────────────────
  {
    id: "BC-SEPESCA-001",
    nombre: "Autorización de Concesión para Acuacultura Comercial",
    dependencia: "Secretaría de Pesca y Acuacultura de Baja California (SEPESCA)",
    url: "https://retys.bajacalifornia.gob.mx",
    plazo: "60 días hábiles",
    costo: "Con costo (ver ficha)",
    keywords: ["pesca", "acuacultura", "mariscos", "ostiones", "camarón", "langosta", "pesquería", "mar"],
  },

  // ── Secretaría de Economía / SEDECO BC ───────────────────────────────────
  {
    id: "BC-SEDECO-001",
    nombre: "Registro en el Padrón Estatal de Comercio de Baja California",
    dependencia: "Secretaría de Desarrollo Económico de Baja California (SEDECO)",
    url: "https://retys.bajacalifornia.gob.mx",
    plazo: "5 días hábiles",
    costo: "Sin costo",
    keywords: ["registro comercio", "padrón estatal", "comerciante", "SEDECO", "economía"],
  },

  // ── SAT (Federal) ─────────────────────────────────────────────────────────
  {
    id: "SAT-RFC",
    nombre: "Alta en el RFC ante el SAT (Registro Federal de Contribuyentes)",
    dependencia: "Servicio de Administración Tributaria (SAT)",
    url: "https://www.sat.gob.mx/tramites/operacion/44074/inscribete-en-el-rfc-si-eres-persona-fisica",
    plazo: "Inmediato (en línea)",
    costo: "Sin costo",
    keywords: ["rfc", "sat", "contribuyente", "impuestos", "persona física", "persona moral", "facturar", "factura", "resico", "iva"],
  },
  {
    id: "SAT-RESICO",
    nombre: "Alta en el Régimen Simplificado de Confianza (RESICO)",
    dependencia: "Servicio de Administración Tributaria (SAT)",
    url: "https://www.sat.gob.mx/consulta/91080/conoce-el-resico",
    plazo: "Inmediato",
    costo: "Sin costo",
    keywords: ["resico", "régimen simplificado", "persona física", "ingresos", "impuestos", "pequeño negocio", "comercio"],
  },

  // ── IMSS ──────────────────────────────────────────────────────────────────
  {
    id: "IMSS-ALTA",
    nombre: "Inscripción Patronal al IMSS y Alta de Trabajadores",
    dependencia: "Instituto Mexicano del Seguro Social (IMSS)",
    url: "https://www.imss.gob.mx/patrones/inscripcion",
    plazo: "Inmediato (en línea)",
    costo: "Sin costo (cuotas obrero-patronales por separado)",
    keywords: ["imss", "trabajadores", "empleados", "seguro social", "nómina", "patrón", "cotización", "afiliación"],
  },

  // ── Ayuntamiento de Tijuana ───────────────────────────────────────────────
  {
    id: "TIJ-LIC-FUNC",
    nombre: "Licencia de Funcionamiento Municipal — Ayuntamiento de Tijuana",
    dependencia: "Dirección de Fiscalización y Recaudación — Ayuntamiento de Tijuana",
    url: "https://tramites.tijuana.gob.mx",
    plazo: "10–15 días hábiles",
    costo: "Variable según giro (ver tarifario municipal)",
    keywords: ["licencia de funcionamiento", "permiso municipal", "ayuntamiento", "tijuana", "apertura", "negocio", "establecimiento comercial"],
  },
  {
    id: "TIJ-USO-SUELO",
    nombre: "Certificado de Uso de Suelo — Ayuntamiento de Tijuana",
    dependencia: "Dirección de Urbanismo — Ayuntamiento de Tijuana",
    url: "https://tramites.tijuana.gob.mx",
    plazo: "5–10 días hábiles",
    costo: "Con costo (ver tarifario)",
    keywords: ["uso de suelo", "zonificación", "local", "establecimiento", "construcción", "renta", "comercio", "industria", "residencial"],
  },
  {
    id: "TIJ-SARE",
    nombre: "SARE — Sistema de Apertura Rápida de Empresas (Tijuana)",
    dependencia: "Ayuntamiento de Tijuana / IMSS / SAT",
    url: "https://tramites.tijuana.gob.mx/sare",
    plazo: "72 horas",
    costo: "Sin costo o mínimo",
    keywords: ["sare", "apertura rápida", "bajo riesgo", "inicio de operaciones", "tienda", "servicio", "comercio", "pequeño negocio"],
  },
  {
    id: "TIJ-ANUNCIO",
    nombre: "Permiso de Anuncio Publicitario — Ayuntamiento de Tijuana",
    dependencia: "Dirección de Fiscalización — Ayuntamiento de Tijuana",
    url: "https://tramites.tijuana.gob.mx",
    plazo: "5–10 días hábiles",
    costo: "Con costo (según dimensiones)",
    keywords: ["anuncio", "letrero", "publicidad exterior", "señalización", "rótulo", "fachada"],
  },
  {
    id: "TIJ-ALCOHOL",
    nombre: "Licencia de Venta de Bebidas Alcohólicas — Ayuntamiento de Tijuana",
    dependencia: "Dirección de Fiscalización — Ayuntamiento de Tijuana",
    url: "https://tramites.tijuana.gob.mx",
    plazo: "30–60 días hábiles",
    costo: "Con costo elevado (ver tarifario)",
    keywords: ["alcohol", "cerveza", "vino", "bar", "cantina", "restaurante con alcohol", "expendio", "tienda de conveniencia", "off", "licencia de alcohol"],
  },
  {
    id: "TIJ-PC",
    nombre: "Visto Bueno de Protección Civil — Ayuntamiento de Tijuana",
    dependencia: "Dirección de Protección Civil Municipal — Tijuana",
    url: "https://tramites.tijuana.gob.mx",
    plazo: "10–20 días hábiles",
    costo: "Con costo (según superficie)",
    keywords: ["protección civil municipal", "visto bueno", "extintores", "salidas de emergencia", "aforo", "establecimiento", "local"],
  },

  // ── Ayuntamiento de Mexicali ──────────────────────────────────────────────
  {
    id: "MXL-LIC-FUNC",
    nombre: "Licencia de Funcionamiento Municipal — Ayuntamiento de Mexicali",
    dependencia: "Tesorería Municipal — Ayuntamiento de Mexicali",
    url: "https://tramites.mexicali.gob.mx",
    plazo: "5–15 días hábiles",
    costo: "Variable según giro",
    keywords: ["mexicali", "licencia de funcionamiento", "permiso municipal", "establecimiento", "negocio"],
  },

  // ── Secretaría de Trabajo / STPS ──────────────────────────────────────────
  {
    id: "STPS-REGLAMENTO",
    nombre: "Reglamento Interno de Trabajo ante la STPS",
    dependencia: "Secretaría del Trabajo y Previsión Social (STPS)",
    url: "https://www.gob.mx/stps",
    plazo: "15 días hábiles",
    costo: "Sin costo",
    keywords: ["stps", "trabajo", "reglamento interno", "empleados", "laboral", "más de 10 trabajadores"],
  },

  // ── INFONAVIT ─────────────────────────────────────────────────────────────
  {
    id: "INFONAVIT-REGISTRO",
    nombre: "Registro Patronal ante el INFONAVIT",
    dependencia: "Instituto del Fondo Nacional de la Vivienda para los Trabajadores (INFONAVIT)",
    url: "https://empresas.infonavit.org.mx",
    plazo: "Inmediato (en línea)",
    costo: "Sin costo (aportaciones del 5% de nómina por separado)",
    keywords: ["infonavit", "vivienda", "aportaciones", "trabajadores", "nómina", "patrón"],
  },

  // ── COFEPRIS (Federal) ────────────────────────────────────────────────────
  {
    id: "COFEPRIS-ALIMENTOS",
    nombre: "Aviso de Funcionamiento de Establecimientos de Alimentos y Bebidas (COFEPRIS federal)",
    dependencia: "COFEPRIS — Comisión Federal para la Protección contra Riesgos Sanitarios",
    url: "https://www.gob.mx/cofepris/documentos/aviso-de-funcionamiento",
    plazo: "Inmediato (en línea)",
    costo: "Sin costo",
    keywords: ["cofepris", "alimentos", "restaurante", "taquería", "cafetería", "panadería", "elaboración de alimentos", "sanitario federal"],
  },

  // ── Secretaría de Economía (federal) ──────────────────────────────────────
  {
    id: "SE-REGISTRO-MARCA",
    nombre: "Registro de Marca ante el IMPI",
    dependencia: "Instituto Mexicano de la Propiedad Industrial (IMPI)",
    url: "https://www.impi.gob.mx",
    plazo: "6–18 meses",
    costo: "Con costo (~$3,000–$6,000 MXN)",
    keywords: ["marca", "registro de marca", "impi", "logo", "nombre comercial", "propiedad intelectual", "franquicia"],
  },
];

// ── Función de búsqueda por texto libre ───────────────────────────────────────

export interface BusquedaOpts {
  maxResultados?: number;
  soloApertura?: boolean;
}

export function buscarTramites(
  query: string,
  opts: BusquedaOpts = {}
): TramiteRETyS[] {
  const { maxResultados = 8 } = opts;
  const terms = query
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/\s+/)
    .filter((t) => t.length > 2);

  if (terms.length === 0) return TRAMITES_RETYS.slice(0, maxResultados);

  const scored = TRAMITES_RETYS.map((t) => {
    const haystack = [t.nombre, t.dependencia, ...t.keywords]
      .join(" ")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    let score = 0;
    for (const term of terms) {
      if (haystack.includes(term)) score += 2;
      // partial match in keywords gives extra weight
      for (const kw of t.keywords) {
        const kwNorm = kw.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        if (kwNorm.includes(term)) score += 1;
      }
    }
    return { tramite: t, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResultados)
    .map((s) => s.tramite);
}

// ── Mapa de giros a trámites clave ────────────────────────────────────────────

export const GIRO_TRAMITES_MAP: Record<string, string[]> = {
  restaurante: ["BC-COEPRIS-001", "TIJ-LIC-FUNC", "TIJ-USO-SUELO", "TIJ-PC", "SAT-RFC", "IMSS-ALTA"],
  taquería: ["BC-COEPRIS-001", "TIJ-LIC-FUNC", "TIJ-USO-SUELO", "TIJ-PC", "SAT-RFC"],
  cafetería: ["BC-COEPRIS-001", "TIJ-LIC-FUNC", "TIJ-USO-SUELO", "SAT-RFC", "IMSS-ALTA"],
  panadería: ["BC-COEPRIS-001", "TIJ-LIC-FUNC", "SAT-RFC", "IMSS-ALTA", "TIJ-PC"],
  farmacia: ["BC-COEPRIS-005", "TIJ-LIC-FUNC", "TIJ-USO-SUELO", "SAT-RFC", "IMSS-ALTA"],
  salón_belleza: ["BC-COEPRIS-001", "TIJ-LIC-FUNC", "TIJ-USO-SUELO", "SAT-RFC"],
  tienda: ["TIJ-SARE", "TIJ-LIC-FUNC", "TIJ-USO-SUELO", "SAT-RFC", "IMSS-ALTA"],
  bar: ["BC-COEPRIS-001", "TIJ-ALCOHOL", "TIJ-LIC-FUNC", "TIJ-PC", "SAT-RFC", "BC-COEPRIS-016"],
  clínica: ["BC-COEPRIS-007", "TIJ-LIC-FUNC", "TIJ-USO-SUELO", "SAT-RFC", "IMSS-ALTA"],
  taller: ["TIJ-LIC-FUNC", "TIJ-USO-SUELO", "TIJ-PC", "SAT-RFC", "IMSS-ALTA", "BC-SPA-001"],
  manufactura: ["TIJ-LIC-FUNC", "TIJ-USO-SUELO", "TIJ-PC", "BC-SEMARNAT-001", "SAT-RFC", "IMSS-ALTA"],
  default: ["TIJ-SARE", "TIJ-LIC-FUNC", "SAT-RFC", "IMSS-ALTA"],
};

export function getTramitesByGiro(giro: string): TramiteRETyS[] {
  const giroNorm = giro.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  for (const [key, ids] of Object.entries(GIRO_TRAMITES_MAP)) {
    const keyNorm = key.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (giroNorm.includes(keyNorm) || keyNorm.includes(giroNorm)) {
      return ids
        .map((id) => TRAMITES_RETYS.find((t) => t.id === id))
        .filter(Boolean) as TramiteRETyS[];
    }
  }

  // Fallback: búsqueda por texto
  const bySearch = buscarTramites(giro, { maxResultados: 5 });
  if (bySearch.length > 0) return bySearch;

  // Default mínimo
  return (GIRO_TRAMITES_MAP.default
    .map((id) => TRAMITES_RETYS.find((t) => t.id === id))
    .filter(Boolean)) as TramiteRETyS[];
}
