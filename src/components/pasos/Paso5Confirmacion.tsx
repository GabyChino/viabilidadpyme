"use client";

import Link from "next/link";
import { UseFormReturn } from "react-hook-form";
import { FormularioData } from "@/lib/types";
import {
  GIROS_COMERCIALES,
  COLONIAS_TIJUANA,
  RANGOS_CAPITAL,
  EMPLEADOS_OPCIONES,
  EXPERIENCIA_OPCIONES,
  MODELO_NEGOCIO_OPCIONES,
  ANIOS_OPERACION_OPCIONES,
  SITUACION_FORMAL_OPCIONES,
  RETO_PRINCIPAL_OPCIONES,
  PERFILES,
  MUNICIPIO_FOCO,
  ESTADO_FOCO,
  etiquetaDe,
} from "@/lib/constants";
import { TarjetaNegocio } from "@/components/pasos/BuscadorNegocio";
import { CheckCircle, Briefcase, MapPin, DollarSign, Users, Sparkles } from "lucide-react";

interface Props {
  form: UseFormReturn<FormularioData>;
}

const VENTAS_OPCIONES = [
  { value: "menos_20k", label: "Menos de $20,000 MXN / mes" },
  { value: "20k_50k", label: "$20,000 – $50,000 MXN / mes" },
  { value: "50k_100k", label: "$50,000 – $100,000 MXN / mes" },
  { value: "100k_250k", label: "$100,000 – $250,000 MXN / mes" },
  { value: "250k_500k", label: "$250,000 – $500,000 MXN / mes" },
  { value: "mas_500k", label: "Más de $500,000 MXN / mes" },
];

function FilaDato({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex justify-between items-start gap-4 py-2 border-b border-border last:border-0">
      <span className="text-xs text-content-3 shrink-0">{label}</span>
      <span className="text-xs font-medium text-content text-right">{value}</span>
    </div>
  );
}

function SeccionResumen({ icono, titulo, children }: { icono: React.ReactNode; titulo: string; children: React.ReactNode }) {
  return (
    <div className="border border-border bg-surface-2 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        {icono}
        <h3 className="text-sm font-semibold text-content">{titulo}</h3>
      </div>
      {children}
    </div>
  );
}

export function Paso5Confirmacion({ form }: Props) {
  const datos = form.getValues();
  const esEstablecido = datos.tipoPerfil === "establecido";

  const tieneLocalLabel = {
    si: "Con local físico",
    no: "A domicilio / en campo",
    virtual: "100% en línea",
  }[datos.tieneLocal ?? "si"];

  const icono = (Icono: typeof Briefcase) => <Icono size={15} className="text-brand-strong" aria-hidden="true" />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3 pb-2 border-b border-border">
        <div className="w-9 h-9 rounded-lg bg-brand-soft flex items-center justify-center" aria-hidden="true">
          <CheckCircle size={18} className="text-brand-strong" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-content">Confirmación</h2>
          <p className="text-sm text-content-3">Revisa los datos antes de iniciar el análisis</p>
        </div>
      </div>

      <div className="bg-brand-700 rounded-xl p-5 text-white">
        <div className="flex items-start gap-3">
          <Sparkles size={20} className="mt-0.5 shrink-0" aria-hidden="true" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-100">
              {datos.tipoPerfil ? PERFILES[datos.tipoPerfil].titulo : ""}
            </p>
            <h3 className="font-semibold mt-0.5">{datos.nombreNegocio || "Tu negocio"}</h3>
            <p className="text-sm text-brand-50 mt-1">{datos.descripcionNegocio}</p>
          </div>
        </div>
      </div>

      {datos.negocioEncontrado && <TarjetaNegocio negocio={datos.negocioEncontrado} />}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SeccionResumen icono={icono(Briefcase)} titulo="Negocio">
          <FilaDato label="Giro comercial" value={etiquetaDe(GIROS_COMERCIALES, datos.giroComercial)} />
          <FilaDato label="Modelo de negocio" value={etiquetaDe(MODELO_NEGOCIO_OPCIONES, datos.modeloNegocio)} />
        </SeccionResumen>

        <SeccionResumen icono={icono(MapPin)} titulo="Ubicación">
          <FilaDato label="Municipio" value={`${MUNICIPIO_FOCO}, ${ESTADO_FOCO}`} />
          <FilaDato label="Colonia / Zona" value={etiquetaDe(COLONIAS_TIJUANA, datos.colonia)} />
          <FilaDato label="Local" value={tieneLocalLabel} />
        </SeccionResumen>

        <SeccionResumen icono={icono(DollarSign)} titulo="Finanzas">
          <FilaDato label={esEstablecido ? "Capital para invertir" : "Capital inicial"} value={etiquetaDe(RANGOS_CAPITAL, datos.capitalDisponible)} />
          <FilaDato label={esEstablecido ? "Ventas promedio" : "Ventas estimadas"} value={etiquetaDe(VENTAS_OPCIONES, datos.ventasMensualesEstimadas)} />
          <FilaDato label="Financiamiento" value={datos.requiereFinanciamiento ? "Sí requiere" : "No requiere"} />
        </SeccionResumen>

        <SeccionResumen icono={icono(Users)} titulo="Operación">
          {esEstablecido && <FilaDato label="Tiempo operando" value={etiquetaDe(ANIOS_OPERACION_OPCIONES, datos.aniosEnOperacion)} />}
          <FilaDato label="Personas" value={etiquetaDe(EMPLEADOS_OPCIONES, datos.numEmpleados)} />
          <FilaDato label="Experiencia" value={etiquetaDe(EXPERIENCIA_OPCIONES, datos.experienciaPrevia)} />
          {esEstablecido && <FilaDato label="Situación formal" value={etiquetaDe(SITUACION_FORMAL_OPCIONES, datos.situacionFormal)} />}
          {esEstablecido && <FilaDato label="Reto principal" value={etiquetaDe(RETO_PRINCIPAL_OPCIONES, datos.retoPrincipal)} />}
        </SeccionResumen>
      </div>

      <div className="bg-surface-2 border border-border rounded-lg p-4">
        <p className="text-xs text-content font-medium mb-1">⏱️ ¿Qué ocurrirá al enviar?</p>
        <ul className="text-xs text-content-2 space-y-1 list-disc list-inside">
          <li>El agente IA consultará los trámites del RETyS de Baja California</li>
          {datos.negocioEncontrado && <li>Usará los datos públicos de tu negocio en el mapa (categoría, horarios, contacto y presencia web)</li>}
          <li>El proceso toma aproximadamente 30–60 segundos</li>
          <li>Podrás conversar con el agente y exportar el análisis en PDF</li>
        </ul>
        <p className="text-[11px] text-content-3 mt-3">
          Al enviar, tus respuestas se procesan con IBM watsonx para generar el análisis. Consulta el{" "}
          <Link href="/privacidad" target="_blank" className="underline hover:text-content">
            aviso de privacidad
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
