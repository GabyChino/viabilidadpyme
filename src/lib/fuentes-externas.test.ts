import { afterEach, describe, expect, it, vi } from "vitest";
import { buscarDenuePorNombre, empleadosDesdeEstrato, esDeTijuana, resultadoDesdeDenue } from "@/lib/denue";
import { buscarAnioFundacion } from "@/lib/investigacion";
import { conCache } from "@/lib/cache";

describe("DENUE", () => {
  const establecimiento = {
    Id: "123",
    Nombre: "FARMACIA SAN JOSE",
    Clase_actividad: "COMERCIO AL POR MENOR DE PRODUCTOS FARMACÉUTICOS Y NATURISTAS",
    Estrato: "0 a 5 personas",
    Tipo_vialidad: "CALLE",
    Calle: "BENITO JUAREZ",
    Num_Exterior: "1234",
    Colonia: "ZONA CENTRO",
    CP: "22000",
    Ubicacion: "TIJUANA, Tijuana, BAJA CALIFORNIA",
    Sitio_internet: "www.farmaciasanjose.mx",
    Latitud: "32.5333",
    Longitud: "-117.0380",
  };

  it("convierte un establecimiento en negocio y sugerencias", () => {
    const { negocio, giroSugerido, coloniaSugerida } = resultadoDesdeDenue(establecimiento);
    expect(negocio).toMatchObject({
      fuente: "denue",
      id: "denue/123",
      nombre: "Farmacia San Jose",
      direccion: "Calle Benito Juarez 1234, Zona Centro, C.P. 22000, Tijuana",
      coloniaMapa: "Zona Centro",
      tamano: "0 a 5 personas",
      sitioWeb: "http://www.farmaciasanjose.mx",
      lat: 32.5333,
      lng: -117.038,
    });
    expect(giroSugerido).toBe("farmacia");
    expect(coloniaSugerida).toBe("centro");
  });

  it("usa 'otra' cuando la colonia no está en la lista y sin coordenadas no da mapa", () => {
    const { negocio, coloniaSugerida } = resultadoDesdeDenue({ ...establecimiento, Colonia: "PORTICOS DE SAN ANTONIO", Latitud: "", Longitud: "" });
    expect(coloniaSugerida).toBe("otra");
    expect(negocio.lat).toBeUndefined();
    expect(negocio.urlMapa).toBeUndefined();
  });

  it("filtra por municipio", () => {
    expect(esDeTijuana(establecimiento)).toBe(true);
    expect(esDeTijuana({ ...establecimiento, Ubicacion: "MEXICALI, Mexicali, BAJA CALIFORNIA" })).toBe(false);
  });

  it.each([
    ["0 a 5 personas", "2_5"],
    ["6 a 10 personas", "6_10"],
    ["11 a 30 personas", "11_30"],
    ["31 a 50 personas", "mas_30"],
    ["251 y más personas", "mas_30"],
    [undefined, undefined],
  ])("estrato %s → %s", (estrato, esperado) => {
    expect(empleadosDesdeEstrato(estrato)).toBe(esperado);
  });
});

describe("respuestas de la API del DENUE", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  const responder = (cuerpo: string) =>
    vi.stubGlobal("fetch", vi.fn(async () => new Response(cuerpo, { status: 200 })));

  it("un token rechazado es un error (para usar OpenStreetMap), no cero resultados", async () => {
    vi.stubEnv("INEGI_DENUE_TOKEN", "token-invalido");
    responder("No Autorizado, utilice una clave valida. ");
    await expect(buscarDenuePorNombre("farmacia")).rejects.toThrow(/token/);
  });

  it("una respuesta sin resultados en texto da una lista vacía", async () => {
    vi.stubEnv("INEGI_DENUE_TOKEN", "token-valido");
    responder("No se encontraron resultados");
    await expect(buscarDenuePorNombre("zzzz")).resolves.toEqual([]);
  });

  it("solo devuelve negocios de Tijuana", async () => {
    vi.stubEnv("INEGI_DENUE_TOKEN", "token-valido");
    responder(JSON.stringify([
      { Id: "1", Nombre: "FARMACIA A", Ubicacion: "TIJUANA, Tijuana, BAJA CALIFORNIA" },
      { Id: "2", Nombre: "FARMACIA B", Ubicacion: "MEXICALI, Mexicali, BAJA CALIFORNIA" },
    ]));
    const resultados = await buscarDenuePorNombre("farmacia");
    expect(resultados.map((r) => r.negocio.id)).toEqual(["denue/1"]);
  });
});

describe("buscarAnioFundacion", () => {
  it.each([
    ["Atendiendo a Tijuana desde 1998 con calidad", 1998],
    ["Fundada en 2015 por la familia Pérez", 2015],
    ["Con más de 20 años de experiencia", 2006],
    ["Since 2010 serving the border", 2010],
  ])("%s → %i", (texto, anio) => {
    expect(buscarAnioFundacion(texto, 2026)).toBe(anio);
  });

  it("ignora años futuros y textos sin antigüedad", () => {
    expect(buscarAnioFundacion("Promoción válida desde 2030", 2026)).toBeUndefined();
    expect(buscarAnioFundacion("Llámanos al 664 123 4567", 2026)).toBeUndefined();
  });
});

describe("conCache", () => {
  it("reutiliza el resultado y comparte consultas simultáneas", async () => {
    let llamadas = 0;
    const obtener = async () => {
      llamadas++;
      return "valor";
    };
    const [a, b] = await Promise.all([conCache("prueba", 1000, obtener), conCache("prueba", 1000, obtener)]);
    await conCache("prueba", 1000, obtener);
    expect([a, b]).toEqual(["valor", "valor"]);
    expect(llamadas).toBe(1);
  });

  it("no guarda resultados nulos", async () => {
    let llamadas = 0;
    const obtener = async () => {
      llamadas++;
      return null;
    };
    await conCache("vacio", 1000, obtener);
    await conCache("vacio", 1000, obtener);
    expect(llamadas).toBe(2);
  });
});
