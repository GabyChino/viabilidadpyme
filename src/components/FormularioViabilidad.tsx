"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { formularioSchema, FormularioData, TipoPerfil, validarCamposEstablecido } from "@/lib/types";
import { MUNICIPIO_FOCO, ESTADO_FOCO, PERFILES, getPasosFormulario } from "@/lib/constants";
import { IndicadorPasos } from "@/components/IndicadorPasos";
import { Paso1TipoNegocio } from "@/components/pasos/Paso1TipoNegocio";
import { Paso2Ubicacion } from "@/components/pasos/Paso2Ubicacion";
import { Paso3Finanzas } from "@/components/pasos/Paso3Finanzas";
import { Paso4Operacion } from "@/components/pasos/Paso4Operacion";
import { Paso5Confirmacion } from "@/components/pasos/Paso5Confirmacion";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Sparkles, Loader2, Lightbulb, Store, ArrowRight, Check, History } from "lucide-react";

const CAMPOS_POR_PASO: Record<number, (keyof FormularioData)[]> = {
  1: ["giroComercial", "nombreNegocio", "descripcionNegocio", "modeloNegocio"],
  2: ["colonia", "tieneLocal"],
  3: ["capitalDisponible", "ventasMensualesEstimadas"],
  4: ["numEmpleados", "experienciaPrevia"],
  5: [],
};

// ── Borrador guardado en el navegador ────────────────────────────────────────

const CLAVE_BORRADOR = "pyme-viabilidad:borrador";
const EVENTO_BORRADOR = "pyme-viabilidad:borrador-cambio";

interface Borrador {
  datos: Partial<FormularioData>;
  paso: number;
  fecha: string;
}

function leerBorradorRaw(): string | null {
  try {
    return localStorage.getItem(CLAVE_BORRADOR);
  } catch {
    return null;
  }
}

function suscribirBorrador(callback: () => void) {
  window.addEventListener(EVENTO_BORRADOR, callback);
  return () => window.removeEventListener(EVENTO_BORRADOR, callback);
}

function escribirBorrador(valor: Borrador | null, avisar = false) {
  try {
    if (valor) localStorage.setItem(CLAVE_BORRADOR, JSON.stringify(valor));
    else localStorage.removeItem(CLAVE_BORRADOR);
    // Solo se avisa al descartar/cargar: avisar en cada tecla re-renderizaría el formulario
    if (avisar) window.dispatchEvent(new Event(EVENTO_BORRADOR));
  } catch {
    // Sin almacenamiento disponible (modo privado, etc.): no se guarda
  }
}

function parsearBorrador(raw: string | null): Borrador | null {
  if (!raw) return null;
  try {
    const b = JSON.parse(raw) as Borrador;
    return b?.datos?.tipoPerfil && b.paso >= 1 ? b : null;
  } catch {
    return null;
  }
}

function AvisoBorrador({ borrador, onContinuar, onDescartar }: { borrador: Borrador; onContinuar: () => void; onDescartar: () => void }) {
  const nombre = borrador.datos.nombreNegocio;
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-brand-soft-border bg-brand-soft p-4" role="status">
      <History size={18} className="text-brand-strong shrink-0" aria-hidden="true" />
      <p className="flex-1 min-w-[12rem] text-sm text-content-2">
        Tienes un formulario sin terminar{nombre ? <> de <strong className="text-content">{nombre}</strong></> : ""} (paso {borrador.paso}).
      </p>
      <button
        type="button"
        onClick={onContinuar}
        className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        Continuar donde me quedé
      </button>
      <button type="button" onClick={onDescartar} className="text-sm font-medium text-content-2 hover:text-content">
        Empezar de nuevo
      </button>
    </div>
  );
}

// ── Paso 0: elegir perfil ────────────────────────────────────────────────────

const DETALLE_PERFIL: Record<TipoPerfil, { Icono: typeof Store; puntos: string[] }> = {
  nuevo: {
    Icono: Lightbulb,
    puntos: ["Evalúa tu idea antes de invertir", "Trámites que necesitarás para abrir", "Riesgos y siguientes pasos"],
  },
  establecido: {
    Icono: Store,
    puntos: ["Busca tu negocio en el mapa", "Trámites que te faltan para formalizarte", "Recomendaciones según tu reto principal"],
  },
};

function SelectorPerfil({ onElegir }: { onElegir: (perfil: TipoPerfil) => void }) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-content">¿Cuál describe mejor tu situación?</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {(Object.keys(PERFILES) as TipoPerfil[]).map((perfil) => {
          const { Icono, puntos } = DETALLE_PERFIL[perfil];
          return (
            <button
              key={perfil}
              type="button"
              onClick={() => onElegir(perfil)}
              className="group text-left flex flex-col gap-4 p-5 rounded-2xl border-2 border-border bg-surface hover:border-brand-500 hover:shadow-md transition-all focus-visible:border-brand-500"
            >
              <div className="w-11 h-11 rounded-xl bg-brand-soft flex items-center justify-center" aria-hidden="true">
                <Icono size={22} className="text-brand-strong" />
              </div>
              <div>
                <p className="text-base font-semibold text-content">{PERFILES[perfil].titulo}</p>
                <p className="text-sm text-content-2 mt-1">{PERFILES[perfil].descripcion}</p>
              </div>
              <ul className="flex flex-col gap-1.5">
                {puntos.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-xs text-content-2">
                    <Check size={13} className="text-brand-strong mt-0.5 shrink-0" aria-hidden="true" />
                    {p}
                  </li>
                ))}
              </ul>
              <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-brand-strong">
                Empezar <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Formulario ───────────────────────────────────────────────────────────────

interface Props {
  onSubmit: (data: FormularioData) => Promise<void>;
  isLoading: boolean;
}

export function FormularioViabilidad({ onSubmit, isLoading }: Props) {
  const [pasoActual, setPasoActual] = useState(1);
  const inicioRef = useRef<HTMLDivElement>(null);

  const form = useForm<FormularioData>({
    resolver: zodResolver(formularioSchema),
    defaultValues: {
      estado: ESTADO_FOCO,
      municipio: MUNICIPIO_FOCO,
      requiereFinanciamiento: false,
      yaOpera: false,
    },
    mode: "onTouched",
  });

  const perfil = useWatch({ control: form.control, name: "tipoPerfil" });
  const borrador = parsearBorrador(useSyncExternalStore(suscribirBorrador, leerBorradorRaw, () => null));

  // Guarda el avance mientras se llena (con una pequeña espera entre teclas)
  const pasoRef = useRef(1); // se actualiza al cambiar de paso
  useEffect(() => {
    let temporizador: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = form.subscribe({
      formState: { values: true },
      callback: ({ values }) => {
        clearTimeout(temporizador);
        temporizador = setTimeout(() => {
          if (values.tipoPerfil) {
            escribirBorrador({ datos: values, paso: pasoRef.current, fecha: new Date().toISOString() });
          }
        }, 600);
      },
    });
    return () => {
      clearTimeout(temporizador);
      unsubscribe();
    };
  }, [form]);

  const continuarBorrador = () => {
    if (!borrador) return;
    form.reset({ ...form.getValues(), ...borrador.datos });
    pasoRef.current = borrador.paso;
    setPasoActual(borrador.paso);
  };
  const pasos = getPasosFormulario(perfil);
  const totalPasos = pasos.length;

  const irAPaso = (paso: number) => {
    setPasoActual(paso);
    pasoRef.current = paso;
    const datos = form.getValues();
    if (datos.tipoPerfil) escribirBorrador({ datos, paso, fecha: new Date().toISOString() });
    inicioRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const elegirPerfil = (nuevo: TipoPerfil) => {
    form.setValue("tipoPerfil", nuevo);
    form.setValue("yaOpera", nuevo === "establecido");
    form.setValue("fuenteDatosNegocio", nuevo === "establecido" ? "busqueda" : undefined);
    if (nuevo === "nuevo") form.setValue("negocioEncontrado", undefined);
    irAPaso(1);
  };

  const avanzar = async () => {
    const datos = form.getValues();

    // Negocio establecido con búsqueda: hay que elegir un resultado o pasar a captura manual
    if (pasoActual === 1 && datos.tipoPerfil === "establecido" && datos.fuenteDatosNegocio === "busqueda" && !datos.negocioEncontrado) {
      form.setError("negocioEncontrado", { message: "Busca y selecciona tu negocio, o elige «Llenar a mano»." });
      return;
    }

    let valido = await form.trigger(CAMPOS_POR_PASO[pasoActual]);

    if (pasoActual === 4) {
      for (const e of validarCamposEstablecido(datos)) {
        form.setError(e.campo, { message: e.mensaje });
        valido = false;
      }
    }

    if (valido) irAPaso(Math.min(pasoActual + 1, totalPasos));
  };

  const retroceder = () => irAPaso(Math.max(pasoActual - 1, 1));

  const handleSubmit = form.handleSubmit(async (data) => {
    await onSubmit(data);
    escribirBorrador(null);
  });

  if (!perfil) {
    return (
      <div className="flex flex-col gap-6">
        {borrador && (
          <AvisoBorrador borrador={borrador} onContinuar={continuarBorrador} onDescartar={() => escribirBorrador(null, true)} />
        )}
        <SelectorPerfil
          onElegir={(p) => {
            escribirBorrador(null, true);
            elegirPerfil(p);
          }}
        />
      </div>
    );
  }

  return (
    <div ref={inicioRef} className="flex flex-col gap-6 scroll-mt-24">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="text-content-2">
          Perfil: <strong className="text-content">{PERFILES[perfil].titulo}</strong>
        </span>
        <button
          type="button"
          onClick={() => elegirPerfil(perfil === "nuevo" ? "establecido" : "nuevo")}
          className="text-brand-strong font-medium hover:underline"
        >
          Cambiar a {PERFILES[perfil === "nuevo" ? "establecido" : "nuevo"].titulo.toLowerCase()}
        </button>
      </div>

      <IndicadorPasos pasoActual={pasoActual} pasos={pasos} />

      <div className="bg-surface rounded-2xl border border-border p-6 min-h-[480px]">
        {pasoActual === 1 && <Paso1TipoNegocio form={form} />}
        {pasoActual === 2 && <Paso2Ubicacion form={form} />}
        {pasoActual === 3 && <Paso3Finanzas form={form} />}
        {pasoActual === 4 && <Paso4Operacion form={form} />}
        {pasoActual === 5 && <Paso5Confirmacion form={form} />}
      </div>

      {/* Navegación */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={pasoActual === 1 ? () => form.resetField("tipoPerfil") : retroceder}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all text-content-2 hover:text-content hover:bg-surface-2"
        >
          <ChevronLeft size={16} aria-hidden="true" />
          {pasoActual === 1 ? "Elegir perfil" : "Anterior"}
        </button>

        <span className="text-xs text-content-3">
          {pasoActual} / {totalPasos}
        </span>

        {pasoActual < totalPasos ? (
          <button
            type="button"
            onClick={avanzar}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition-all shadow-sm"
          >
            Siguiente
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        ) : (
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 text-white text-sm font-semibold rounded-lg transition-all shadow-sm",
              isLoading ? "bg-brand-400 cursor-not-allowed" : "bg-brand-600 hover:bg-brand-700"
            )}
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                Analizando...
              </>
            ) : (
              <>
                <Sparkles size={16} aria-hidden="true" />
                Iniciar Análisis IA
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
