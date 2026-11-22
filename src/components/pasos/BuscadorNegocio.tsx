"use client";

import { useState } from "react";
import { Search, Loader2, MapPin, Globe, Phone, Clock, ExternalLink, X, Store, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { MapaOsm } from "@/components/ui/MapaOsm";
import type { NegocioEncontrado, ResultadoBusqueda } from "@/lib/types";

// ── Tarjeta del negocio seleccionado ─────────────────────────────────────────

export function TarjetaNegocio({ negocio, onQuitar }: { negocio: NegocioEncontrado; onQuitar?: () => void }) {
  return (
    <div className="rounded-xl border border-brand-soft-border bg-brand-soft p-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-surface flex items-center justify-center shrink-0" aria-hidden="true">
          <Store size={17} className="text-brand-strong" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-content">{negocio.nombre}</p>
          <p className="text-xs text-content-2 mt-0.5">{negocio.direccion}</p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-content-2">
            {negocio.categoria && (
              <span>
                {negocio.categoria}
                {negocio.especialidad && ` · ${negocio.especialidad}`}
              </span>
            )}
            {negocio.tamano && (
              <span className="flex items-center gap-1"><Users size={12} aria-hidden="true" /> {negocio.tamano}</span>
            )}
            {negocio.telefono && (
              <span className="flex items-center gap-1"><Phone size={12} aria-hidden="true" /> {negocio.telefono}</span>
            )}
            {negocio.sitioWeb && (
              <span className="flex items-center gap-1"><Globe size={12} aria-hidden="true" /> Tiene sitio web</span>
            )}
            {!!negocio.horarios?.length && (
              <span className="flex items-center gap-1"><Clock size={12} aria-hidden="true" /> {negocio.horarios[0]}</span>
            )}
          </div>
          {negocio.urlMapa && (
            <a
              href={negocio.urlMapa}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-brand-strong hover:underline"
            >
              Ver en el mapa <ExternalLink size={11} aria-hidden="true" />
            </a>
          )}
          <p className="text-[11px] text-content-3 mt-1">
            Fuente: {negocio.fuente === "denue" ? "DENUE de INEGI" : "OpenStreetMap"}
          </p>
        </div>
        {onQuitar && (
          <button
            type="button"
            onClick={onQuitar}
            className="p-1 text-content-3 hover:text-content shrink-0"
            aria-label="Quitar negocio seleccionado"
            title="Elegir otro negocio"
          >
            <X size={15} />
          </button>
        )}
      </div>
      {negocio.lat !== undefined && negocio.lng !== undefined && (
        <MapaOsm lat={negocio.lat} lng={negocio.lng} radioM={250} titulo={`Ubicación de ${negocio.nombre}`} className="h-40 mt-3" />
      )}
      <p className="text-[11px] text-content-3 mt-3">
        El asesor IA usará estos datos públicos (categoría, ubicación, horarios, contacto y presencia web) en tu análisis.
      </p>
    </div>
  );
}

// ── Buscador ─────────────────────────────────────────────────────────────────

interface Props {
  onSeleccionar: (resultado: ResultadoBusqueda) => void;
  onCapturarManual: () => void;
  error?: string;
}

export function BuscadorNegocio({ onSeleccionar, onCapturarManual, error }: Props) {
  const [consulta, setConsulta] = useState("");
  const [cargando, setCargando] = useState(false);
  const [resultados, setResultados] = useState<ResultadoBusqueda[] | null>(null);
  const [mensaje, setMensaje] = useState("");

  const buscar = async () => {
    const q = consulta.trim();
    if (q.length < 3) {
      setMensaje("Escribe al menos 3 caracteres.");
      return;
    }
    setCargando(true);
    setMensaje("");
    try {
      const res = await fetch(`/api/negocios/buscar?q=${encodeURIComponent(q)}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "No se pudo completar la búsqueda.");
      setResultados(data.resultados);
    } catch (e) {
      setResultados(null);
      setMensaje(e instanceof Error ? e.message : "No se pudo completar la búsqueda.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="buscar-negocio" className="text-sm font-medium text-content-2">
          Busca tu negocio *
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-content-3" aria-hidden="true" />
            <input
              id="buscar-negocio"
              type="search"
              value={consulta}
              onChange={(e) => setConsulta(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  buscar();
                }
              }}
              maxLength={100}
              placeholder="Ej: Tacos El Gordo Zona Río"
              className={cn(
                "w-full pl-9 pr-3 py-2.5 text-sm border rounded-lg outline-none bg-surface-2 text-content placeholder:text-content-3",
                error ? "border-red-500" : "border-border focus:ring-2 focus:ring-brand-500/25 focus:border-brand-500"
              )}
            />
          </div>
          <button
            type="button"
            onClick={buscar}
            disabled={cargando}
            className="shrink-0 flex items-center gap-1.5 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {cargando ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <Search size={15} aria-hidden="true" />}
            Buscar
          </button>
        </div>
        <p className="text-xs text-content-3">Escribe el nombre como aparece en tu letrero; agrega la colonia o el giro si es común (ej. “farmacia Zona Río”).</p>
        {(error || mensaje) && <p className="text-xs text-red-600 dark:text-red-400" role="alert">{error || mensaje}</p>}
      </div>

      {resultados && (
        <div aria-live="polite">
          {resultados.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-4 text-center">
              <p className="text-sm text-content-2">No encontramos ese negocio en OpenStreetMap. Muchos negocios aún no están registrados: prueba otro nombre o captura tus datos.</p>
              <button
                type="button"
                onClick={onCapturarManual}
                className="mt-2 text-sm font-medium text-brand-strong hover:underline"
              >
                Capturar los datos a mano
              </button>
            </div>
          ) : (
            <>
              <p className="text-xs text-content-3 mb-2">Selecciona tu negocio:</p>
              <ul className="flex flex-col gap-2">
                {resultados.map((r) => (
                  <li key={r.negocio.id}>
                    <button
                      type="button"
                      onClick={() => onSeleccionar(r)}
                      className="w-full text-left flex items-start gap-3 p-3 border border-border rounded-lg bg-surface-2 hover:border-brand-500 hover:bg-surface-3 transition-colors"
                    >
                      <MapPin size={15} className="text-brand-strong mt-0.5 shrink-0" aria-hidden="true" />
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-medium text-content">{r.negocio.nombre}</span>
                        <span className="block text-xs text-content-3 mt-0.5">{r.negocio.direccion}</span>
                        {r.negocio.categoria && (
                          <span className="block text-xs text-content-2 mt-1">
                            {r.negocio.categoria}
                            {r.negocio.especialidad && ` · ${r.negocio.especialidad}`}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between gap-2 mt-2">
                <p className="text-[11px] text-content-3">
                  {resultados.some((r) => r.negocio.fuente === "denue") && (
                    <>
                      <a href="https://www.inegi.org.mx/app/mapa/denue/" target="_blank" rel="noopener noreferrer" className="underline">
                        DENUE, INEGI
                      </a>
                      {" · "}
                    </>
                  )}
                  Datos ©{" "}
                  <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="underline">
                    colaboradores de OpenStreetMap
                  </a>
                </p>
                <button
                  type="button"
                  onClick={onCapturarManual}
                  className="text-xs font-medium text-brand-strong hover:underline"
                >
                  ¿No aparece? Capturar a mano
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
