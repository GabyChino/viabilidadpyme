import { describe, expect, it } from "vitest";
import { extraerJson, repararJson } from "@/lib/watsonx";

const leer = (json: string) => JSON.parse(repararJson(json));

describe("repararJson", () => {
  it("deja intacto un JSON válido", () => {
    const json = '{"a": "dice \\"hola\\"", "b": [1, 2]}';
    expect(repararJson(json)).toBe(json);
  });

  it("quita comas sobrantes", () => {
    expect(leer('{"x": [1, 2,], "y": 3,}')).toEqual({ x: [1, 2], y: 3 });
  });

  it("escapa comillas dentro de un texto", () => {
    expect(leer('{"descripcion": "11 farmacias, incluyendo "Farmacias del Ahorro" a 86 m", "puntaje": 2}')).toEqual({
      descripcion: '11 farmacias, incluyendo "Farmacias del Ahorro" a 86 m',
      puntaje: 2,
    });
  });

  it("escapa comillas internas en listas", () => {
    expect(leer('{"riesgos": ["competencia de "La + Barata" cerca", "otro"]}').riesgos[0]).toBe(
      'competencia de "La + Barata" cerca'
    );
  });

  it("pone comillas a valores de texto sin abrir", () => {
    expect(leer('{"descripcion": alta demanda",\n "puntaje": 4}')).toEqual({ descripcion: "alta demanda", puntaje: 4 });
  });

  it("no rompe textos que contienen dos puntos", () => {
    expect(leer('{"nota": "Nota: algo importante", "x": [1,]}')).toEqual({ nota: "Nota: algo importante", x: [1] });
  });
});

describe("extraerJson", () => {
  it("extrae el bloque ```json", () => {
    expect(extraerJson('Aquí está:\n```json\n{"a": 1}\n```\nSaludos')).toBe('{"a": 1}');
  });

  it("recorta el texto alrededor del objeto", () => {
    expect(extraerJson('Claro, este es el resultado: {"a": {"b": 2}} ¿algo más?')).toBe('{"a": {"b": 2}}');
  });
});
