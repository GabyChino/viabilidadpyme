"use client";

import { UseFormReturn } from "react-hook-form";
import { FormularioData } from "@/lib/types";
import {
  EMPLEADOS_OPCIONES,
  EXPERIENCIA_OPCIONES,
  ANIOS_OPERACION_OPCIONES,
  SITUACION_FORMAL_OPCIONES,
  RETO_PRINCIPAL_OPCIONES,
} from "@/lib/constants";
import { Select, RadioGroup } from "@/components/ui/FormControls";
import { PISTA_AUTOLLENADO } from "@/components/pasos/PanelInvestigacion";
import { Users } from "lucide-react";

interface Props {
  form: UseFormReturn<FormularioData>;
}

export function Paso4Operacion({ form }: Props) {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const esEstablecido = watch("tipoPerfil") === "establecido";
  const autollenados = watch("camposAutollenados") ?? [];
  const aniosAutollenado = autollenados.includes("aniosEnOperacion");
  const tamanoDenue = watch("negocioEncontrado")?.tamano;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3 pb-2 border-b border-border">
        <div className="w-9 h-9 rounded-lg bg-brand-soft flex items-center justify-center" aria-hidden="true">
          <Users size={18} className="text-brand-strong" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-content">
            {esEstablecido ? "Situación actual" : "Estructura Operativa"}
          </h2>
          <p className="text-sm text-content-3">
            {esEstablecido ? "Cómo opera hoy tu negocio y qué quieres lograr" : "Cuéntanos sobre cómo operará tu negocio"}
          </p>
        </div>
      </div>

      {esEstablecido && (
        <Select
          label="Tiempo en operación *"
          options={ANIOS_OPERACION_OPCIONES}
          placeholder="¿Hace cuánto abriste?"
          hint={aniosAutollenado ? PISTA_AUTOLLENADO : undefined}
          error={errors.aniosEnOperacion?.message}
          {...register("aniosEnOperacion")}
        />
      )}

      <Select
        label={esEstablecido ? "Personas que trabajan hoy en el negocio *" : "Número de empleados *"}
        options={EMPLEADOS_OPCIONES}
        placeholder={esEstablecido ? "¿Cuántas personas trabajan?" : "¿Cuántas personas trabajarán?"}
        hint={
          autollenados.includes("numEmpleados") && tamanoDenue
            ? `Sugerido porque INEGI registra a tu negocio con ${tamanoDenue}; ajústalo a tu situación actual.`
            : "Considera empleados de tiempo completo, parcial y familiares"
        }
        error={errors.numEmpleados?.message}
        {...register("numEmpleados")}
      />

      <Select
        label={esEstablecido ? "Tu experiencia total en el sector *" : "Experiencia previa en el sector *"}
        options={EXPERIENCIA_OPCIONES}
        placeholder="¿Cuánta experiencia tienes?"
        hint="La experiencia es uno de los factores más importantes de éxito"
        error={errors.experienciaPrevia?.message}
        {...register("experienciaPrevia")}
      />

      {esEstablecido && (
        <>
          <RadioGroup
            label="Situación formal del negocio *"
            options={SITUACION_FORMAL_OPCIONES}
            value={watch("situacionFormal") ?? ""}
            onChange={(val) => setValue("situacionFormal", val, { shouldValidate: true })}
            error={errors.situacionFormal?.message}
          />

          <Select
            label="¿Cuál es tu reto principal hoy? *"
            options={RETO_PRINCIPAL_OPCIONES}
            placeholder="Elige el que más te importa"
            hint="El análisis y los siguientes pasos se enfocarán en este objetivo"
            error={errors.retoPrincipal?.message}
            {...register("retoPrincipal")}
          />
        </>
      )}

      <div className="bg-surface-2 border border-border rounded-lg p-4">
        <h4 className="text-xs font-semibold text-content-2 uppercase tracking-wide mb-2">
          🔍 ¿Qué analiza el agente con estos datos?
        </h4>
        <ul className="text-xs text-content-2 space-y-1 list-disc list-inside">
          <li>Trámites del RETyS aplicables a tu giro{esEstablecido ? " y los que te falten según tu situación formal" : ""}</li>
          <li>Costo estimado de nómina frente a tu capital y ventas</li>
          <li>{esEstablecido ? "Riesgos y oportunidades según tu reto principal" : "Riesgos operativos de un negocio nuevo en Tijuana"}</li>
        </ul>
      </div>
    </div>
  );
}
