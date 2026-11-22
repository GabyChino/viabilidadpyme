"use client";

import { useRef, useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { CampoInvestigable, FormularioData, InvestigacionNegocio, ResultadoBusqueda } from "@/lib/types";
import { GIROS_COMERCIALES, MODELO_NEGOCIO_OPCIONES } from "@/lib/constants";
import { Select, Input, Textarea, RadioGroup } from "@/components/ui/FormControls";
import { BuscadorNegocio, TarjetaNegocio } from "@/components/pasos/BuscadorNegocio";
import { EstadoInvestigacion, PanelInvestigacion, PISTA_AUTOLLENADO } from "@/components/pasos/PanelInvestigacion";
import { cn } from "@/lib/utils";
import { Briefcase, Search, PenLine } from "lucide-react";

interface Props {
  form: UseFormReturn<FormularioData>;
}

export function Paso1TipoNegocio({ form }: Props) {
  const {
    register,
    watch,
    setValue,
    getValues,
    clearErrors,
    formState: { errors },
  } = form;
  const [investigacion, setInvestigacion] = useState<EstadoInvestigacion | null>(null);
  // Evita aplicar el resultado de un negocio que ya no está seleccionado
  const investigandoId = useRef<string | null>(null);

  const esEstablecido = watch("tipoPerfil") === "establecido";
  const fuente = watch("fuenteDatosNegocio") ?? "busqueda";
  const negocio = watch("negocioEncontrado");
  const autollenados = watch("camposAutollenados") ?? [];
  const pista = (campo: string, normal?: string) => (autollenados.includes(campo) ? PISTA_AUTOLLENADO : normal);

  // Con búsqueda, los campos aparecen al elegir el negocio (ya prellenados)
  const mostrarCampos = !esEstablecido || fuente === "manual" || !!negocio;

  const cambiarFuente = (nueva: "busqueda" | "manual") => {
    setValue("fuenteDatosNegocio", nueva);
    if (nueva === "manual") quitarNegocio();
    clearErrors("negocioEncontrado");
  };

  const quitarNegocio = () => {
    investigandoId.current = null;
    setInvestigacion(null);
    setValue("negocioEncontrado", undefined);
    setValue("camposAutollenados", undefined);
  };

  /** Llena los campos que estén vacíos o que se hayan llenado automáticamente antes. */
  const aplicarSugerencias = (sugerencias: InvestigacionNegocio["sugerencias"], previos: string[]) => {
    const llenados: string[] = [];
    for (const [campo, valor] of Object.entries(sugerencias) as [CampoInvestigable, string | undefined][]) {
      if (!valor) continue;
      const actual = getValues(campo);
      if (actual && !previos.includes(campo)) continue; // no pisar lo que escribió el usuario
      setValue(campo, valor, { shouldValidate: true });
      llenados.push(campo);
    }
    return llenados;
  };

  const investigar = async (elegido: ResultadoBusqueda["negocio"], previos: string[]) => {
    investigandoId.current = elegido.id;
    setInvestigacion({ fase: "investigando", tieneSitioWeb: !!elegido.sitioWeb, fuente: elegido.fuente });
    try {
      const res = await fetch("/api/negocios/investigar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: elegido.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (investigandoId.current !== elegido.id) return;
      if (!res.ok) throw new Error(data.error ?? "No pudimos investigar el negocio.");
      const resultado = data as InvestigacionNegocio;
      // La ficha consultada en el servidor puede traer más datos que el resultado de búsqueda
      setValue("negocioEncontrado", resultado.negocio);
      const llenados = aplicarSugerencias(resultado.sugerencias, previos);
      const todos = [...new Set([...previos, ...llenados])];
      setValue("camposAutollenados", todos);
      setInvestigacion({ fase: "lista", resultado, camposLlenados: todos.length });
    } catch (e) {
      if (investigandoId.current !== elegido.id) return;
      setInvestigacion({ fase: "error", mensaje: e instanceof Error ? e.message : "No pudimos investigar el negocio." });
    }
  };

  const seleccionar = ({ negocio, giroSugerido, coloniaSugerida }: ResultadoBusqueda) => {
    // Lo que ya se sabe por el mapa se llena al instante; el resto, al terminar la investigación
    const previos = ["nombreNegocio", "tieneLocal"];
    setValue("fuenteDatosNegocio", "busqueda");
    setValue("negocioEncontrado", negocio);
    setValue("nombreNegocio", negocio.nombre.slice(0, 80));
    if (giroSugerido) {
      setValue("giroComercial", giroSugerido);
      previos.push("giroComercial");
    }
    if (coloniaSugerida) {
      setValue("colonia", coloniaSugerida);
      previos.push("colonia");
    }
    setValue("tieneLocal", "si");
    setValue("camposAutollenados", previos);
    clearErrors();
    investigar(negocio, previos);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3 pb-2 border-b border-border">
        <div className="w-9 h-9 rounded-lg bg-brand-soft flex items-center justify-center" aria-hidden="true">
          <Briefcase size={18} className="text-brand-strong" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-content">
            {esEstablecido ? "Tu negocio" : "Tu idea de negocio"}
          </h2>
          <p className="text-sm text-content-3">
            {esEstablecido
              ? "Búscalo en el mapa para ahorrar tiempo, o captura sus datos"
              : "Cuéntanos qué quieres emprender"}
          </p>
        </div>
      </div>

      {esEstablecido && (
        <>
          {/* Cómo capturar los datos */}
          <div role="radiogroup" aria-label="Cómo quieres capturar los datos" className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-surface-2 border border-border">
            {([
              { valor: "busqueda", texto: "Buscar en el mapa", Icono: Search },
              { valor: "manual", texto: "Llenar a mano", Icono: PenLine },
            ] as const).map(({ valor, texto, Icono }) => (
              <button
                key={valor}
                type="button"
                role="radio"
                aria-checked={fuente === valor}
                onClick={() => cambiarFuente(valor)}
                className={cn(
                  "flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  fuente === valor
                    ? "bg-surface text-content shadow-sm border border-border"
                    : "text-content-3 hover:text-content"
                )}
              >
                <Icono size={15} aria-hidden="true" />
                {texto}
              </button>
            ))}
          </div>

          {fuente === "busqueda" &&
            (negocio ? (
              <TarjetaNegocio negocio={negocio} onQuitar={quitarNegocio} />
            ) : (
              <BuscadorNegocio
                onSeleccionar={seleccionar}
                onCapturarManual={() => cambiarFuente("manual")}
                error={errors.negocioEncontrado?.message}
              />
            ))}

          {negocio && investigacion && <PanelInvestigacion estado={investigacion} />}
        </>
      )}

      {mostrarCampos && (
        <>
          <Input
            label="Nombre del negocio *"
            placeholder={esEstablecido ? "Nombre con el que te conocen tus clientes" : "Ej: Tortillería La Lupita"}
            hint={pista("nombreNegocio")}
            error={errors.nombreNegocio?.message}
            {...register("nombreNegocio")}
          />

          <Select
            label="Giro comercial *"
            options={GIROS_COMERCIALES}
            placeholder={esEstablecido ? "¿A qué se dedica tu negocio?" : "¿A qué se dedicará tu negocio?"}
            hint={pista("giroComercial", "Selecciona el sector que mejor describe tu actividad")}
            error={errors.giroComercial?.message}
            {...register("giroComercial")}
          />

          <Textarea
            label="Descripción del negocio *"
            placeholder={
              investigacion?.fase === "investigando"
                ? "Estamos redactando la descripción con los datos públicos de tu negocio…"
                : esEstablecido
                ? "Qué vendes, quiénes son tus clientes y qué te distingue de la competencia..."
                : "Qué vas a vender, a quién y cómo te diferenciarás de la competencia..."
            }
            hint={pista("descripcionNegocio", "Mínimo 20 caracteres. Esto ayuda a personalizar el análisis.")}
            error={errors.descripcionNegocio?.message}
            {...register("descripcionNegocio")}
          />

          <RadioGroup
            label="Modelo de negocio *"
            options={MODELO_NEGOCIO_OPCIONES}
            value={watch("modeloNegocio") ?? ""}
            onChange={(val) => setValue("modeloNegocio", val, { shouldValidate: true })}
            hint={pista("modeloNegocio")}
            error={errors.modeloNegocio?.message}
          />
        </>
      )}
    </div>
  );
}
