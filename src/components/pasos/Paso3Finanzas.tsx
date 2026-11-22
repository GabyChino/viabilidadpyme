"use client";

import { UseFormReturn } from "react-hook-form";
import { FormularioData } from "@/lib/types";
import { RANGOS_CAPITAL } from "@/lib/constants";
import { Select, Toggle } from "@/components/ui/FormControls";
import { DollarSign } from "lucide-react";

interface Props {
  form: UseFormReturn<FormularioData>;
}

const VENTAS_ESTIMADAS_OPCIONES = [
  { value: "menos_20k", label: "Menos de $20,000 MXN / mes" },
  { value: "20k_50k", label: "$20,000 – $50,000 MXN / mes" },
  { value: "50k_100k", label: "$50,000 – $100,000 MXN / mes" },
  { value: "100k_250k", label: "$100,000 – $250,000 MXN / mes" },
  { value: "250k_500k", label: "$250,000 – $500,000 MXN / mes" },
  { value: "mas_500k", label: "Más de $500,000 MXN / mes" },
];

const MONTO_FINANCIAMIENTO_OPCIONES = [
  { value: "menos_100k", label: "Menos de $100,000 MXN" },
  { value: "100k_300k", label: "$100,000 – $300,000 MXN" },
  { value: "300k_500k", label: "$300,000 – $500,000 MXN" },
  { value: "500k_1m", label: "$500,000 – $1,000,000 MXN" },
  { value: "mas_1m", label: "Más de $1,000,000 MXN" },
];

export function Paso3Finanzas({ form }: Props) {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const requiereFinanciamiento = watch("requiereFinanciamiento");
  const esEstablecido = watch("tipoPerfil") === "establecido";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3 pb-2 border-b border-border">
        <div className="w-9 h-9 rounded-lg bg-brand-soft flex items-center justify-center" aria-hidden="true">
          <DollarSign size={18} className="text-brand-strong" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-content">Información Financiera</h2>
          <p className="text-sm text-content-3">
            {esEstablecido ? "Ventas actuales y capital para invertir" : "Capital e inversión disponible"}
          </p>
        </div>
      </div>

      <Select
        label={esEstablecido ? "Capital disponible para invertir o crecer *" : "Capital inicial disponible *"}
        options={RANGOS_CAPITAL}
        placeholder="¿Con cuánto capital cuentas?"
        hint={
          esEstablecido
            ? "Lo que podrías destinar a mejoras, inventario, expansión o formalización"
            : "Incluye ahorros, préstamos familiares y cualquier recurso disponible"
        }
        error={errors.capitalDisponible?.message}
        {...register("capitalDisponible")}
      />

      <Select
        label={esEstablecido ? "Ventas mensuales promedio *" : "Ventas mensuales estimadas *"}
        options={VENTAS_ESTIMADAS_OPCIONES}
        placeholder={esEstablecido ? "¿Cuánto vendes al mes, en promedio?" : "¿Cuánto esperas vender al mes?"}
        hint={esEstablecido ? "Promedio de los últimos 6 meses" : "Estimación conservadora de tus primeros 6 meses"}
        error={errors.ventasMensualesEstimadas?.message}
        {...register("ventasMensualesEstimadas")}
      />

      <Toggle
        label="¿Requieres financiamiento externo?"
        descripcion="Crédito bancario, FONACOT, INADEM, inversionistas, etc."
        checked={requiereFinanciamiento ?? false}
        onChange={(val) => setValue("requiereFinanciamiento", val)}
      />

      {requiereFinanciamiento && (
        <div className="pl-4 border-l-2 border-brand-soft-border">
          <Select
            label="Monto de financiamiento requerido"
            options={MONTO_FINANCIAMIENTO_OPCIONES}
            placeholder="¿Cuánto necesitas?"
            hint="El agente analizará opciones de financiamiento disponibles en tu estado"
            {...register("montoFinanciamiento")}
          />
        </div>
      )}

      <div className="bg-surface-2 border border-border rounded-lg p-4">
        <h4 className="text-xs font-semibold text-content-3 uppercase tracking-wide mb-2">
          💡 ¿Por qué importa esta información?
        </h4>
        <ul className="text-xs text-content-3 space-y-1 list-disc list-inside">
          <li>El capital inicial determina tu horizonte de supervivencia</li>
          <li>Las ventas estimadas se usarán para evaluar la viabilidad financiera</li>
          <li>El agente calculará tu punto de equilibrio y flujo de caja</li>
        </ul>
      </div>
    </div>
  );
}
