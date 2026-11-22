/**
 * src/lib/negocios.ts
 *
 * Convierte los datos de un negocio encontrado en OpenStreetMap
 * a los valores del formulario (giro comercial y colonia de Tijuana).
 * Es una aproximación: el usuario siempre puede corregir lo sugerido.
 */

import type { NegocioEncontrado } from "@/lib/types";

function normalizar(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// Palabras clave de la categoría → giro. Cubre etiquetas de OSM (en inglés) y
// clases de actividad SCIAN del DENUE (en español, ya sin acentos). El orden importa.
const GIRO_POR_CATEGORIA: [RegExp, string][] = [
  [/restaurant|cafe|coffee|bakery|meal_|fast_food|food_court|taqueria|bar_and_grill|panader|restaurante|cafeteria|alimentos preparados|antojitos|fuentes de sodas/, "restaurante_cafeteria"],
  [/grocery|convenience|supermarket|abarrote|minisuper|deli\b|autoservicio|ultramarinos/, "tienda_abarrotes"],
  [/liquor|butcher|beverage|food_store|market|carnicer|tortill|panifica|frutas|verduras|bebidas/, "comercio_alimentos"],
  [/clothing|clothes|shoe|boutique|ropa|zapater|calzado/, "ropa_calzado"],
  [/hardware|doityourself|building_materials|home_improvement|ferreter|tlapaler/, "ferreteria"],
  [/pharmacy|drugstore|chemist|farmacia|farmaceutic/, "farmacia"],
  [/stationery|book_store|books|office_supplies|copyshop|papeler/, "papeleria"],
  [/beauty|hair|barber|nail|spa\b|salon|cosmetics|estetica|peluquer/, "salon_belleza"],
  [/car_repair|automovil|automotri|tyres|mechanic|car_wash|taller|reparacion mecanica|llant/, "taller_mecanico"],
  [/laundry|dry_clean|lavander|tintorer/, "lavanderia"],
  [/gym|fitness|sports_club|gimnasio|acondicionamiento fisico|clubes deportivos/, "gimnasio"],
  [/school|education|tutoring|language|academ|escuela|educacion|ensenanza/, "educacion"],
  [/lodging|hotel|motel|hostel|guest_house|hospedaje|alojamiento/, "turismo_hospedaje"],
  [/software|it_|computer|electronics_repair|web\b|computo|informatica/, "servicios_ti"],
  [/lawyer|accounting|consult|insurance|real_estate|notary|abogad|contador|contabilidad|bufete|juridic/, "consultoria"],
  [/moving|logistics|courier|transport|trucking|autotransporte|mensajeria|paqueteria/, "transporte"],
  [/contractor|construction|electrician|plumber|construccion|edificacion/, "construccion"],
];

export function sugerirGiro(categoria?: string): string | undefined {
  if (!categoria) return undefined;
  const c = normalizar(categoria);
  return GIRO_POR_CATEGORIA.find(([re]) => re.test(c))?.[1];
}

// Nombres de colonia en la dirección → valor de COLONIAS_TIJUANA.
// Los más específicos van primero ("zona centro" antes que "centro").
const COLONIA_POR_TEXTO: [string, string][] = [
  ["zona urbana rio", "zona_rio"],
  ["zona rio", "zona_rio"],
  ["parque industrial otay", "otay_industrial"],
  ["ciudad industrial", "otay_industrial"],
  ["parque industrial la presa", "la_presa_industrial"],
  ["mesa de otay", "otay"],
  ["otay", "otay"],
  ["playas de tijuana", "playas_tijuana"],
  ["san antonio del mar", "san_antonio_del_mar"],
  ["sanchez taboada", "sanchez_taboada"],
  ["villa del real", "villa_del_real"],
  ["camino verde", "camino_verde"],
  ["el florido", "el_florido"],
  ["valle de las palmas", "valle_las_palmas"],
  ["lomas del porvenir", "lomas_del_porvenir"],
  ["nueva tijuana", "nueva_tijuana"],
  ["libertad", "coronado"],
  ["mariano matamoros", "mariano_matamoros"],
  ["chaparral", "el_chaparral"],
  ["garita", "el_chaparral"],
  ["zona norte", "zona_fronteriza"],
  ["la mesa", "la_mesa"],
  ["la presa", "la_presa"],
  ["zona centro", "centro"],
  ["centro", "centro"],
];

export function sugerirColonia(direccion?: string): string | undefined {
  if (!direccion) return undefined;
  const d = normalizar(direccion);
  return COLONIA_POR_TEXTO.find(([texto]) => d.includes(texto))?.[1];
}

// ── Descripción para el agente IA ────────────────────────────────────────────

/** Resume en texto los datos públicos de un negocio encontrado en el mapa. */
export function describirNegocioPublico(n: NegocioEncontrado): string {
  const esDenue = n.fuente === "denue";
  const lineas = [
    `Fuente: ${esDenue ? "DENUE de INEGI (directorio oficial de negocios)" : "OpenStreetMap"}`,
    `Nombre registrado: ${n.nombre}`,
    `Dirección: ${n.direccion}`,
    n.coloniaMapa && `Colonia: ${n.coloniaMapa}`,
    n.categoria && `Categoría: ${n.categoria}`,
    n.especialidad && `Especialidad: ${n.especialidad}`,
    n.marca && `Marca o cadena: ${n.marca}`,
    n.tamano && `Tamaño (personas que trabajan): ${n.tamano}`,
    `Sitio web: ${n.sitioWeb ? "sí tiene" : "no registrado"}`,
    `Teléfono: ${n.telefono ? "registrado" : "no registrado"}`,
    !esDenue && `Redes sociales: ${n.redesSociales?.length ? "registradas" : "no registradas"}`,
    n.horarios?.length && `Horarios: ${n.horarios.join("; ")}`,
  ];
  return lineas.filter(Boolean).join("\n");
}
