import { describe, expect, it } from "vitest";
import { describirNegocioPublico, sugerirColonia, sugerirGiro } from "@/lib/negocios";

describe("sugerirGiro", () => {
  it.each([
    // Etiquetas de OpenStreetMap
    ["amenity fast_food tacos", "restaurante_cafeteria"],
    ["amenity pharmacy", "farmacia"],
    ["shop convenience", "tienda_abarrotes"],
    ["shop hairdresser", "salon_belleza"],
    ["shop car_repair", "taller_mecanico"],
    // Clases de actividad del DENUE (SCIAN)
    ["Comercio al por menor de productos farmacéuticos y naturistas", "farmacia"],
    ["Restaurantes con servicio de preparación de alimentos a la carta o de comida corrida", "restaurante_cafeteria"],
    ["Comercio al por menor en tiendas de abarrotes, ultramarinos y misceláneas", "tienda_abarrotes"],
    ["Comercio al por menor en tiendas de autoservicio", "tienda_abarrotes"],
    ["Elaboración de tortillas de maíz y molienda de nixtamal", "comercio_alimentos"],
    ["Salones y clínicas de belleza y peluquerías", "salon_belleza"],
    ["Reparación mecánica en general de automóviles y camiones", "taller_mecanico"],
    ["Autotransporte local de carga general", "transporte"],
    ["Servicios de contabilidad y auditoría", "consultoria"],
    ["Edificación de vivienda unifamiliar", "construccion"],
  ])("%s → %s", (categoria, giro) => {
    expect(sugerirGiro(categoria)).toBe(giro);
  });

  it("no inventa un giro sin palabras clave", () => {
    expect(sugerirGiro("Fabricación de componentes aeroespaciales")).toBeUndefined();
    expect(sugerirGiro(undefined)).toBeUndefined();
  });
});

describe("sugerirColonia", () => {
  it("prefiere el nombre más específico", () => {
    expect(sugerirColonia("Blvd. Agua Caliente, Zona Centro, Tijuana")).toBe("centro");
    expect(sugerirColonia("Paseo de los Héroes, Zona Urbana Río, 22010")).toBe("zona_rio");
    expect(sugerirColonia("Parque Industrial Otay, Tijuana")).toBe("otay_industrial");
  });

  it("ignora acentos y mayúsculas", () => {
    expect(sugerirColonia("SÁNCHEZ TABOADA")).toBe("sanchez_taboada");
  });

  it("devuelve undefined si no reconoce la colonia", () => {
    expect(sugerirColonia("Pórticos de San Antonio")).toBeUndefined();
  });
});

describe("describirNegocioPublico", () => {
  it("indica la fuente y no afirma redes sociales para el DENUE", () => {
    const texto = describirNegocioPublico({
      fuente: "denue",
      id: "denue/1",
      nombre: "Farmacia Ejemplo",
      direccion: "Calle 1, Centro, Tijuana",
      tamano: "0 a 5 personas",
    });
    expect(texto).toContain("DENUE de INEGI");
    expect(texto).toContain("0 a 5 personas");
    expect(texto).not.toContain("Redes sociales");
  });
});
