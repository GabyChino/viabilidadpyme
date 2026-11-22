"use client";

import { UseFormReturn } from "react-hook-form";
import { FormularioData } from "@/lib/types";
import { COLONIAS_TIJUANA, MUNICIPIO_FOCO, ESTADO_FOCO } from "@/lib/constants";
import { Select, RadioGroup } from "@/components/ui/FormControls";
import { MapPin } from "lucide-react";

interface Props {
  form: UseFormReturn<FormularioData>;
}

const TIPO_LOCAL_OPCIONES = {
  nuevo: [
    { value: "si", label: "Sí, tendré local físico", descripcion: "Punto de venta, oficina o taller con dirección fija" },
    { value: "no", label: "No, operaré a domicilio / en campo", descripcion: "Delivery, servicio a domicilio, visitas a clientes" },
    { value: "virtual", label: "Negocio 100% virtual / en línea", descripcion: "E-commerce, servicios digitales, trabajo remoto" },
  ],
  establecido: [
    { value: "si", label: "Sí, tengo local físico", descripcion: "Punto de venta, oficina o taller con dirección fija" },
    { value: "no", label: "No, opero a domicilio / en campo", descripcion: "Delivery, servicio a domicilio, visitas a clientes" },
    { value: "virtual", label: "Opero 100% en línea", descripcion: "E-commerce, servicios digitales, trabajo remoto" },
  ],
};

// Agrupa las colonias por zona para el selector
const coloniasOpciones = COLONIAS_TIJUANA.map((c) => ({
  value: c.value,
  label: `${c.label}${c.zona !== "Otra" ? ` — ${c.zona}` : ""}`,
}));

export function Paso2Ubicacion({ form }: Props) {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const esEstablecido = watch("tipoPerfil") === "establecido";
  const negocio = watch("negocioEncontrado");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3 pb-2 border-b border-border">
        <div className="w-9 h-9 rounded-lg bg-brand-soft flex items-center justify-center" aria-hidden="true">
          <MapPin size={18} className="text-brand-strong" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-content">Ubicación en Tijuana</h2>
          <p className="text-sm text-content-3">
            {esEstablecido ? "¿En qué zona o colonia opera tu negocio?" : "¿En qué zona o colonia operará tu negocio?"}
          </p>
        </div>
      </div>

      {/* Municipio fijo */}
      <div className="flex items-center gap-3 bg-brand-soft border border-brand-soft-border rounded-xl p-3">
        <span className="text-xl" aria-hidden="true">📍</span>
        <div>
          <p className="text-xs font-semibold text-content-2">
            Municipio: <span className="text-brand-strong">{MUNICIPIO_FOCO}, {ESTADO_FOCO}</span>
          </p>
          <p className="text-xs text-content-3 mt-0.5">
            {negocio?.direccion
              ? `Dirección en el mapa: ${negocio.direccion}`
              : "Plataforma enfocada en Tijuana, Baja California."}
          </p>
        </div>
      </div>

      <Select
        label="Colonia / Zona *"
        options={coloniasOpciones}
        placeholder="¿En qué parte de Tijuana?"
        hint={
          negocio?.coloniaMapa && watch("colonia") === "otra"
            ? `En el mapa aparece como «${negocio.coloniaMapa}», que no está en la lista; el análisis usará ese nombre`
            : negocio
            ? "Sugerida a partir de la dirección del mapa; corrígela si no coincide"
            : "El agente considerará el contexto de tu zona"
        }
        error={errors.colonia?.message}
        {...register("colonia")}
      />

      <RadioGroup
        label={esEstablecido ? "¿Tienes local físico? *" : "¿Tendrás local físico? *"}
        options={TIPO_LOCAL_OPCIONES[esEstablecido ? "establecido" : "nuevo"]}
        value={watch("tieneLocal") ?? ""}
        onChange={(val) =>
          setValue("tieneLocal", val as "si" | "no" | "virtual", {
            shouldValidate: true,
          })
        }
        error={errors.tieneLocal?.message}
      />
    </div>
  );
}
