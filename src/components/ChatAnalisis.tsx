"use client";

import { useState, type Ref } from "react";
import { Bot, RotateCcw } from "lucide-react";
import { FormularioData, ResultadoAnalisis } from "@/lib/types";
import { Conversacion } from "@/components/chat/Conversacion";

interface Props {
  datos: FormularioData;
  resultado: ResultadoAnalisis;
  inputRef?: Ref<HTMLTextAreaElement>;
}

const SUGERENCIAS = {
  nuevo: [
    "¿Qué trámites necesito para abrir?",
    "¿Cómo mejorar mi puntaje?",
    "¿Cuáles son mis principales riesgos?",
    "¿Qué financiamiento hay en Tijuana?",
  ],
  establecido: [
    "¿Qué trámites me faltan?",
    "¿Cómo atraer más clientes?",
    "¿Cómo mejorar mi puntaje?",
    "¿Qué financiamiento hay para crecer?",
  ],
};

function buildMensajeInicial(datos: FormularioData, resultado: ResultadoAnalisis): string {
  const nivel =
    resultado.nivelRiesgo === "bajo"
      ? "favorable ✅"
      : resultado.nivelRiesgo === "medio"
      ? "moderado ⚠️"
      : "desafiante ❌";

  return (
    `Analicé **${datos.nombreNegocio}** (${datos.giroComercial.replace(/_/g, " ")}) en ${datos.municipio}, Baja California.\n\n` +
    `**Resultado:** ${resultado.clasificacion ?? `Viabilidad ${nivel}`} — ` +
    `${resultado.puntajeTotal ?? resultado.puntuacionViabilidad} ${resultado.puntajeTotal ? "/ 50 pts" : "/ 100 pts"}\n\n` +
    `Puedo profundizar en trámites RETyS, fortalezas, riesgos o siguientes pasos. ¿Qué quieres explorar?`
  );
}

function buildContexto(datos: FormularioData, resultado: ResultadoAnalisis): string {
  const n = datos.negocioEncontrado;
  const perfil =
    datos.tipoPerfil === "establecido"
      ? `Perfil: negocio establecido (opera desde hace ${(datos.aniosEnOperacion ?? "").replace(/_/g, " ")} año(s)) | ` +
        `Situación formal: ${datos.situacionFormal ?? "sin dato"} | Reto principal: ${(datos.retoPrincipal ?? "").replace(/_/g, " ")}\n`
      : "Perfil: emprendedor nuevo (aún no opera)\n";
  const mapa = n
    ? `En OpenStreetMap: ${n.categoria ?? ""}` +
      (n.especialidad ? ` (${n.especialidad})` : "") +
      ` · Sitio web: ${n.sitioWeb ? "sí" : "no"} · Teléfono: ${n.telefono ? "sí" : "no"}\n`
    : "";
  const c = resultado.competencia;
  const competencia = c
    ? `Competencia en OpenStreetMap: ${c.total}${c.limiteAlcanzado ? "+" : ""} negocios similares a menos de ${c.radioM} m` +
      (c.porTipo.length ? ` (${c.porTipo.map((t) => `${t.tipo}: ${t.cantidad}`).join(", ")})` : "") +
      "\n"
    : "";
  return (
    perfil +
    mapa +
    competencia +
    `Negocio: ${datos.nombreNegocio} | Giro: ${datos.giroComercial.replace(/_/g, " ")} | ` +
    `Colonia: ${datos.colonia.replace(/_/g, " ")}, ${datos.municipio}\n` +
    `Descripción: ${datos.descripcionNegocio}\n` +
    `Capital: ${datos.capitalDisponible.replace(/_/g, " ")} MXN | Empleados: ${datos.numEmpleados.replace(/_/g, " ")} | ` +
    `Experiencia: ${datos.experienciaPrevia.replace(/_/g, " ")}\n` +
    `Puntaje: ${resultado.puntajeTotal ?? resultado.puntuacionViabilidad} | ` +
    `Clasificación: ${resultado.clasificacion ?? resultado.nivelRiesgo}\n` +
    `Resumen: ${resultado.resumenEjecutivo}`
  ).slice(0, 2000);
}

export function ChatAnalisis({ datos, resultado, inputRef }: Props) {
  const [reinicios, setReinicios] = useState(0);

  return (
    <section
      aria-label="Chat con el asesor"
      className="flex flex-col h-full bg-surface border border-border rounded-2xl overflow-hidden"
    >
      <div className="shrink-0 px-5 py-4 border-b border-border bg-surface flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-brand-700 flex items-center justify-center" aria-hidden="true">
            <Bot size={18} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-content leading-none">Asesor de Viabilidad PYME</p>
            <p className="text-xs text-content-3 mt-0.5">IBM watsonx Orchestrate · RETyS B.C.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setReinicios((n) => n + 1)}
          className="p-1.5 text-content-3 hover:text-content transition-colors rounded-md hover:bg-surface-2"
          aria-label="Reiniciar conversación"
          title="Reiniciar conversación"
        >
          <RotateCcw size={15} />
        </button>
      </div>

      <Conversacion
        key={reinicios}
        mensajeInicial={buildMensajeInicial(datos, resultado)}
        sugerencias={SUGERENCIAS[datos.tipoPerfil ?? "nuevo"]}
        contexto={buildContexto(datos, resultado)}
        inputRef={inputRef}
      />
    </section>
  );
}
