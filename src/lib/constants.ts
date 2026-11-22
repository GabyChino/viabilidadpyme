// Giros comerciales basados en SCIAN (Sistema de Clasificación Industrial de América del Norte)
export const GIROS_COMERCIALES = [
  { value: "comercio_alimentos",    label: "Comercio de alimentos y bebidas" },
  { value: "restaurante_cafeteria", label: "Restaurante / Cafetería / Fonda" },
  { value: "tienda_abarrotes",      label: "Tienda de abarrotes / Minisuper" },
  { value: "ropa_calzado",          label: "Ropa y calzado" },
  { value: "ferreteria",            label: "Ferretería y materiales de construcción" },
  { value: "farmacia",              label: "Farmacia / Botica" },
  { value: "papeleria",             label: "Papelería y artículos de oficina" },
  { value: "salon_belleza",         label: "Salón de belleza / Estética" },
  { value: "taller_mecanico",       label: "Taller mecánico / Automotriz" },
  { value: "lavanderia",            label: "Lavandería / Tintorería" },
  { value: "gimnasio",              label: "Gimnasio / Centro deportivo" },
  { value: "servicios_ti",          label: "Servicios de TI / Desarrollo de software" },
  { value: "consultoria",           label: "Consultoría y servicios profesionales" },
  { value: "educacion",             label: "Educación / Academia / Centro de capacitación" },
  { value: "construccion",          label: "Construcción y obra civil" },
  { value: "manufactura",           label: "Manufactura / Maquiladora" },
  { value: "transporte",            label: "Transporte y logística" },
  { value: "turismo_hospedaje",     label: "Turismo / Hospedaje / Hotel" },
  { value: "agropecuario",          label: "Agropecuario / Agricultura" },
  { value: "otro",                  label: "Otro giro comercial" },
];

// ─── Enfoque geográfico: Tijuana, Baja California ───────────────────────────
// La plataforma está enfocada en el municipio de Tijuana en su fase inicial.
export const MUNICIPIO_FOCO = "Tijuana";
export const ESTADO_FOCO    = "Baja California";

// Colonias y delegaciones de Tijuana agrupadas por zona
export const COLONIAS_TIJUANA: { value: string; label: string; zona: string }[] = [
  // Centro / Zona Río
  { value: "centro",               label: "Centro / Zona Centro",             zona: "Centro"     },
  { value: "zona_rio",             label: "Zona Río",                         zona: "Centro"     },
  { value: "la_mesa",              label: "La Mesa",                          zona: "Centro"     },
  { value: "otay",                 label: "Otay / Mesa de Otay",              zona: "Centro"     },
  // Norte
  { value: "sanchez_taboada",      label: "Sánchez Taboada",                  zona: "Norte"      },
  { value: "villa_del_real",       label: "Villa del Real",                   zona: "Norte"      },
  { value: "camino_verde",         label: "Camino Verde",                     zona: "Norte"      },
  { value: "la_presa",             label: "La Presa",                         zona: "Norte"      },
  // Este
  { value: "el_florido",           label: "El Florido",                       zona: "Este"       },
  { value: "valle_las_palmas",     label: "Valle de las Palmas",              zona: "Este"       },
  { value: "lomas_del_porvenir",   label: "Lomas del Porvenir",               zona: "Este"       },
  { value: "nueva_tijuana",        label: "Nueva Tijuana",                    zona: "Este"       },
  // Sur / Playas
  { value: "playas_tijuana",       label: "Playas de Tijuana",                zona: "Sur"        },
  { value: "san_antonio_del_mar",  label: "San Antonio del Mar",              zona: "Sur"        },
  { value: "coronado",             label: "Col. Libertad / Coronado",         zona: "Sur"        },
  { value: "mariano_matamoros",    label: "Mariano Matamoros",                zona: "Sur"        },
  // Zona Fronteriza
  { value: "zona_fronteriza",      label: "Zona Fronteriza / Puerta México",  zona: "Frontera"   },
  { value: "el_chaparral",         label: "El Chaparral / Garita",            zona: "Frontera"   },
  // Delegaciones industriales
  { value: "pacifico",             label: "Delegación Pacífico",              zona: "Industrial" },
  { value: "otay_industrial",      label: "Parque Industrial Otay",           zona: "Industrial" },
  { value: "la_presa_industrial",  label: "Parque Industrial La Presa",       zona: "Industrial" },
  // Otra
  { value: "otra",                 label: "Otra colonia / delegación",        zona: "Otra"       },
];

export const RANGOS_CAPITAL = [
  { value: "menos_50k", label: "Menos de $50,000 MXN" },
  { value: "50k_100k", label: "$50,000 – $100,000 MXN" },
  { value: "100k_300k", label: "$100,000 – $300,000 MXN" },
  { value: "300k_500k", label: "$300,000 – $500,000 MXN" },
  { value: "500k_1m", label: "$500,000 – $1,000,000 MXN" },
  { value: "mas_1m", label: "Más de $1,000,000 MXN" },
];

export const EXPERIENCIA_OPCIONES = [
  { value: "ninguna", label: "Sin experiencia previa" },
  { value: "menos_1", label: "Menos de 1 año" },
  { value: "1_3", label: "1 a 3 años" },
  { value: "3_5", label: "3 a 5 años" },
  { value: "mas_5", label: "Más de 5 años" },
];

export const EMPLEADOS_OPCIONES = [
  { value: "solo", label: "Solo yo (1 persona)" },
  { value: "2_5", label: "2 a 5 empleados" },
  { value: "6_10", label: "6 a 10 empleados" },
  { value: "11_30", label: "11 a 30 empleados" },
  { value: "mas_30", label: "Más de 30 empleados" },
];

export const MODELO_NEGOCIO_OPCIONES = [
  { value: "b2c", label: "B2C – Vendo directo al consumidor final" },
  { value: "b2b", label: "B2B – Vendo a otras empresas" },
  { value: "mixto", label: "Mixto – Ambos modelos" },
  { value: "online", label: "E-commerce / Venta en línea" },
  { value: "franquicia", label: "Franquicia" },
];

// ─── Perfil del usuario ──────────────────────────────────────────────────────

export const PERFILES = {
  nuevo: {
    titulo: "Emprendedor nuevo",
    descripcion: "Tengo una idea o estoy por abrir mi negocio.",
  },
  establecido: {
    titulo: "Negocio establecido",
    descripcion: "Mi negocio ya opera y quiero evaluar su situación o crecer.",
  },
} as const;

export const ANIOS_OPERACION_OPCIONES = [
  { value: "menos_1", label: "Menos de 1 año" },
  { value: "1_2", label: "1 a 2 años" },
  { value: "2_5", label: "2 a 5 años" },
  { value: "mas_5", label: "Más de 5 años" },
];

export const SITUACION_FORMAL_OPCIONES = [
  { value: "formal", label: "Formal", descripcion: "Tengo RFC, licencia de funcionamiento y permisos al día" },
  { value: "parcial", label: "Parcialmente formal", descripcion: "Tengo algunos registros (p. ej. RFC) pero me faltan permisos" },
  { value: "informal", label: "Informal", descripcion: "Todavía no tengo registros ni permisos" },
];

export const RETO_PRINCIPAL_OPCIONES = [
  { value: "formalizar", label: "Formalizar mi negocio (permisos y trámites)" },
  { value: "aumentar_ventas", label: "Aumentar ventas y clientes" },
  { value: "financiamiento", label: "Conseguir financiamiento" },
  { value: "expandir", label: "Abrir otra sucursal o expandirme" },
  { value: "reducir_costos", label: "Reducir costos y mejorar márgenes" },
  { value: "digitalizar", label: "Vender en línea / presencia digital" },
];

export const PASOS_FORMULARIO_NUEVO = [
  { id: 1, titulo: "Tu idea",       descripcion: "Cuéntanos sobre tu idea de negocio" },
  { id: 2, titulo: "Ubicación",     descripcion: "¿En qué zona de Tijuana?" },
  { id: 3, titulo: "Finanzas",      descripcion: "Capital e inversión disponible" },
  { id: 4, titulo: "Operación",     descripcion: "Cómo funcionará tu negocio" },
  { id: 5, titulo: "Confirmación",  descripcion: "Revisa y envía tu análisis" },
];

export const PASOS_FORMULARIO_ESTABLECIDO = [
  { id: 1, titulo: "Tu negocio",    descripcion: "Búscalo en el mapa o captura sus datos" },
  { id: 2, titulo: "Ubicación",     descripcion: "¿Dónde opera tu negocio?" },
  { id: 3, titulo: "Finanzas",      descripcion: "Ventas actuales y capital" },
  { id: 4, titulo: "Operación",     descripcion: "Situación actual del negocio" },
  { id: 5, titulo: "Confirmación",  descripcion: "Revisa y envía tu análisis" },
];

export function getPasosFormulario(perfil?: "nuevo" | "establecido") {
  return perfil === "establecido" ? PASOS_FORMULARIO_ESTABLECIDO : PASOS_FORMULARIO_NUEVO;
}

/** Busca la etiqueta legible de un valor dentro de una lista de opciones. */
export function etiquetaDe(opciones: { value: string; label: string }[], valor?: string) {
  return opciones.find((o) => o.value === valor)?.label ?? valor ?? "";
}
