"use client";

import { CompetenciaZona, ResultadoAnalisis } from "@/lib/types";
import { MapaOsm } from "@/components/ui/MapaOsm";
import { cn, getColorViabilidad, getBgViabilidad, getLabelViabilidad } from "@/lib/utils";
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  TrendingUp,
  RotateCcw,
  Download,
  ExternalLink,
  ShieldCheck,
  FileText,
  Sparkles,
  Info,
  MessageCircle,
  MapPin,
} from "lucide-react";

interface Props {
  resultado: ResultadoAnalisis;
  nombreNegocio: string;
  onNuevoAnalisis: () => void;
  /** Lleva al usuario al chat de la página */
  onAbrirChat: () => void;
}

function GaugeViabilidad({ puntuacion }: { puntuacion: number }) {
  const angulo = (puntuacion / 100) * 180 - 90;
  const color =
    puntuacion >= 70 ? "#15803d" : puntuacion >= 40 ? "#b45309" : "#b91c1c";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-40 h-20 overflow-hidden">
        <svg
          viewBox="0 0 160 80"
          className="w-full h-full"
          role="img"
          aria-label={`Puntuación de viabilidad: ${puntuacion} de 100`}
        >
          <path d="M 10 80 A 70 70 0 0 1 150 80" fill="none" className="stroke-surface-3" strokeWidth="12" strokeLinecap="round" />
          <path d="M 10 80 A 70 70 0 0 1 57 24" fill="none" stroke="#fca5a5" strokeWidth="12" strokeLinecap="round" />
          <path d="M 57 24 A 70 70 0 0 1 103 24" fill="none" stroke="#fcd34d" strokeWidth="12" strokeLinecap="round" />
          <path d="M 103 24 A 70 70 0 0 1 150 80" fill="none" stroke="#86efac" strokeWidth="12" strokeLinecap="round" />
          <g transform={`translate(80, 80) rotate(${angulo})`}>
            <line x1="0" y1="0" x2="0" y2="-55" stroke={color} strokeWidth="3" strokeLinecap="round" />
            <circle cx="0" cy="0" r="5" fill={color} />
          </g>
        </svg>
      </div>
      <div className="text-center">
        <span className={cn("text-4xl font-bold", getColorViabilidad(puntuacion))}>
          {puntuacion}
        </span>
        <span className="text-lg text-content-3">/100</span>
        <p className={cn("text-sm font-semibold mt-0.5", getColorViabilidad(puntuacion))}>
          {getLabelViabilidad(puntuacion)}
        </p>
      </div>
    </div>
  );
}

/** Barra de puntuación para los 10 criterios (escala 1-5) */
function CriterioBar({ nombre, descripcion, puntaje }: { nombre: string; descripcion: string; puntaje: number }) {
  const pct = (puntaje / 5) * 100;
  const nivel = puntaje >= 4 ? "alto" : puntaje === 3 ? "medio" : "bajo";
  const color = { alto: "bg-green-600", medio: "bg-amber-500", bajo: "bg-red-600" }[nivel];
  const texto = {
    alto: "text-green-700 dark:text-green-400",
    medio: "text-amber-700 dark:text-amber-400",
    bajo: "text-red-700 dark:text-red-400",
  }[nivel];

  return (
    <div className="space-y-1 print-break-avoid">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-content">{nombre}</span>
        <span className={cn("text-xs font-bold shrink-0", texto)}>{puntaje}/5</span>
      </div>
      <div
        className="h-1.5 bg-surface-3 rounded-full overflow-hidden"
        role="meter"
        aria-label={nombre}
        aria-valuemin={0}
        aria-valuemax={5}
        aria-valuenow={puntaje}
      >
        <div className={cn("h-full rounded-full transition-all duration-700", color)} style={{ width: `${pct}%` }} />
      </div>
      {descripcion && (
        <p className="text-xs text-content-3 leading-tight">{descripcion}</p>
      )}
    </div>
  );
}

/** Badge de aplicabilidad para trámites RETyS */
function AplicabilidadBadge({ valor }: { valor: string }) {
  const styles: Record<string, string> = {
    "CONFIRMADO": "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/40 dark:text-green-300 dark:border-green-700/40",
    "POSIBLEMENTE APLICABLE": "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700/40",
    "NO CONFIRMADO": "bg-surface-2 text-content-2 border-border",
    "NO APLICABLE": "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700/30",
  };
  return (
    <span className={cn("text-xs px-2 py-0.5 rounded-full border font-medium shrink-0 self-start", styles[valor] ?? styles["NO CONFIRMADO"])}>
      {valor}
    </span>
  );
}

function ListaHallazgos({
  titulo, items, icono, clases,
}: {
  titulo: string;
  items: string[];
  icono: React.ReactNode;
  clases: { caja: string; titulo: string; texto: string };
}) {
  return (
    <div className={cn("rounded-xl border p-4 print-break-avoid", clases.caja)}>
      <div className="flex items-center gap-2 mb-3">
        {icono}
        <h4 className={cn("text-xs font-semibold", clases.titulo)}>{titulo}</h4>
      </div>
      <ul className="space-y-2 list-disc pl-4">
        {items.map((item, i) => (
          <li key={i} className={cn("text-xs leading-relaxed", clases.texto)}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function TarjetaCompetencia({ competencia: c }: { competencia: CompetenciaZona }) {
  const donde = c.centro.origen === "negocio" ? "de tu negocio" : "del centro de tu colonia";
  return (
    <div className="bg-surface rounded-xl border border-border p-5 print-break-avoid">
      <div className="flex items-center gap-2 mb-4">
        <MapPin size={16} className="text-brand-strong" aria-hidden="true" />
        <h3 className="text-sm font-semibold text-content">Competencia cercana</h3>
        <span className="text-xs text-content-3 ml-auto">Radio de {c.radioM} m</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-3xl font-bold text-content">
              {c.total}
              {c.limiteAlcanzado && "+"}
            </p>
            <p className="text-sm text-content-2">
              negocios similares registrados a menos de {c.radioM} m {donde}
            </p>
          </div>
          {c.porTipo.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {c.porTipo.map((t) => (
                <li key={t.tipo} className="text-xs px-2 py-1 rounded-md bg-surface-2 border border-border text-content-2">
                  {t.tipo}: <span className="font-semibold text-content">{t.cantidad}</span>
                </li>
              ))}
            </ul>
          )}
          {!!c.porTamano?.length && (
            <div>
              <p className="text-xs font-semibold text-content-2 mb-2">Por tamaño (personas que trabajan)</p>
              <ul className="flex flex-wrap gap-2">
                {c.porTamano.map((t) => (
                  <li key={t.tamano} className="text-xs px-2 py-1 rounded-md bg-surface-2 border border-border text-content-2">
                    {t.tamano}: <span className="font-semibold text-content">{t.cantidad}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {c.cercanos.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-content-2 mb-2">Los más cercanos</p>
              <ul className="space-y-1.5">
                {c.cercanos.map((n, i) => (
                  <li key={i} className="flex items-baseline justify-between gap-3 text-xs">
                    <span className="text-content truncate">
                      {n.nombre} <span className="text-content-3">· {n.tipo}</span>
                    </span>
                    <span className="text-content-3 shrink-0">{n.distanciaM} m</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <MapaOsm
          lat={c.centro.lat}
          lng={c.centro.lng}
          radioM={c.radioM}
          titulo="Mapa de la zona analizada"
          className="h-56 md:h-full min-h-56 no-print"
        />
      </div>
      <p className="text-[11px] text-content-3 mt-4">
        {c.fuente === "denue" ? (
          <>
            Fuente:{" "}
            <a href="https://www.inegi.org.mx/app/mapa/denue/" target="_blank" rel="noopener noreferrer" className="underline">
              DENUE, INEGI
            </a>
            . Directorio oficial de negocios; puede no incluir los que abrieron después de su última actualización.
          </>
        ) : (
          <>
            Fuente: ©{" "}
            <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="underline">
              colaboradores de OpenStreetMap
            </a>
            . Es un conteo mínimo: muchos negocios pequeños aún no están registrados en el mapa.
          </>
        )}
      </p>
    </div>
  );
}

export function PanelResultados({ resultado, nombreNegocio, onNuevoAnalisis, onAbrirChat }: Props) {
  const {
    puntuacionViabilidad, nivelRiesgo, resumenEjecutivo,
    recomendaciones, alertas, powerBiEmbedUrl,
    criterios, puntajeTotal, clasificacion, nivelConfianza,
    fortalezas, incertidumbres, tramitesIdentificados,
    siguientesPasos, notaMetodologica, fuenteAnalisis, competencia,
  } = resultado;

  const iconoRiesgo = {
    bajo: <CheckCircle size={16} className="text-green-600 dark:text-green-400" aria-hidden="true" />,
    medio: <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400" aria-hidden="true" />,
    alto: <XCircle size={16} className="text-red-600 dark:text-red-400" aria-hidden="true" />,
  }[nivelRiesgo];

  const esSimulacion = fuenteAnalisis === "simulacion" || !fuenteAnalisis;
  const pasos = siguientesPasos?.length ? siguientesPasos : recomendaciones;
  const hayHallazgos =
    (fortalezas?.length ?? 0) > 0 || alertas.length > 0 || (incertidumbres?.length ?? 0) > 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <h2 className="text-xl font-bold text-content">Análisis de Viabilidad</h2>
            {!esSimulacion && (
              <span className="text-xs px-2 py-0.5 bg-brand-soft text-brand-strong rounded-full border border-brand-soft-border font-medium flex items-center gap-1">
                <Sparkles size={10} aria-hidden="true" /> Agente IA
              </span>
            )}
          </div>
          <p className="text-sm text-content-3">{nombreNegocio}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap no-print">
          <button
            type="button"
            onClick={onNuevoAnalisis}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-content-2 border border-border rounded-lg hover:bg-surface-2 transition-all"
          >
            <RotateCcw size={13} aria-hidden="true" />
            Nuevo análisis
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-all"
            title="Abre el diálogo de impresión; elige «Guardar como PDF»"
          >
            <Download size={13} aria-hidden="true" />
            Exportar PDF
          </button>
          <button
            type="button"
            onClick={onAbrirChat}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-brand-700 rounded-lg hover:bg-brand-800 transition-all"
          >
            <MessageCircle size={13} aria-hidden="true" />
            Hablar con el Agente IA
          </button>
        </div>
      </div>

      {/* Aviso de simulación (arriba, para que se vea antes que los números) */}
      {esSimulacion && notaMetodologica && (
        <div className="rounded-xl border p-4 bg-amber-50 border-amber-300 dark:bg-amber-900/10 dark:border-amber-700/30" role="status">
          <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">{notaMetodologica}</p>
        </div>
      )}

      {/* Gauge + Resumen */}
      <div className={cn("rounded-2xl border-2 p-6 print-break-avoid", getBgViabilidad(puntuacionViabilidad))}>
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <GaugeViabilidad puntuacion={puntuacionViabilidad} />
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1">
              {iconoRiesgo}
              <span className="text-sm font-semibold text-content-2">
                Nivel de riesgo: {nivelRiesgo}
              </span>
              {nivelConfianza && (
                <span className="text-xs text-content-3 sm:ml-auto">· {nivelConfianza}</span>
              )}
            </div>
            {puntajeTotal !== undefined && clasificacion && (
              <div className="mb-2">
                <span className="text-xs text-content-3">
                  Modelo 10 criterios: <span className="font-bold text-content">{puntajeTotal}/50</span>
                  {" "}— {clasificacion}
                </span>
              </div>
            )}
            <p className="text-sm text-content-2 leading-relaxed">{resumenEjecutivo}</p>
          </div>
        </div>
      </div>

      {/* 10 Criterios de Evaluación */}
      {criterios && criterios.length > 0 && (
        <div className="bg-surface rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp size={16} className="text-brand-strong" aria-hidden="true" />
            <h3 className="text-sm font-semibold text-content">Evaluación — 10 Criterios</h3>
            {puntajeTotal !== undefined && (
              <span className="ml-auto text-xs text-content-3 font-medium">
                Total: <span className="text-content font-bold">{puntajeTotal}/50</span>
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {criterios.map((c, i) => (
              <CriterioBar key={i} nombre={c.nombre} descripcion={c.descripcion} puntaje={c.puntaje} />
            ))}
          </div>
        </div>
      )}

      {/* Competencia cercana (OpenStreetMap) */}
      {competencia && <TarjetaCompetencia competencia={competencia} />}

      {/* Fortalezas + Riesgos + Incertidumbres */}
      {hayHallazgos && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {fortalezas && fortalezas.length > 0 && (
            <ListaHallazgos
              titulo="Fortalezas"
              items={fortalezas}
              icono={<CheckCircle size={14} className="text-green-600 dark:text-green-400" aria-hidden="true" />}
              clases={{
                caja: "bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-700/30",
                titulo: "text-green-800 dark:text-green-300",
                texto: "text-green-900 dark:text-green-200",
              }}
            />
          )}
          {alertas.length > 0 && (
            <ListaHallazgos
              titulo="Riesgos"
              items={alertas}
              icono={<AlertTriangle size={14} className="text-amber-600 dark:text-amber-400" aria-hidden="true" />}
              clases={{
                caja: "bg-amber-50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-700/30",
                titulo: "text-amber-800 dark:text-amber-300",
                texto: "text-amber-900 dark:text-amber-200",
              }}
            />
          )}
          {incertidumbres && incertidumbres.length > 0 && (
            <ListaHallazgos
              titulo="Incertidumbres"
              items={incertidumbres}
              icono={<Info size={14} className="text-content-3" aria-hidden="true" />}
              clases={{ caja: "bg-surface-2 border-border", titulo: "text-content-2", texto: "text-content-2" }}
            />
          )}
        </div>
      )}

      {/* Trámites RETyS */}
      {tramitesIdentificados && tramitesIdentificados.length > 0 && (
        <div className="bg-surface rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <FileText size={16} className="text-brand-strong" aria-hidden="true" />
            <h3 className="text-sm font-semibold text-content">Trámites RETyS Identificados</h3>
            <span className="text-xs text-content-3 ml-auto">Baja California</span>
          </div>
          <ul className="space-y-3">
            {tramitesIdentificados.map((t, i) => (
              <li key={i} className="flex flex-col sm:flex-row sm:items-start gap-2 pb-3 border-b border-border last:border-0 last:pb-0 print-break-avoid">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-content">{t.nombre}</p>
                  <p className="text-xs text-content-3 mt-0.5">{t.dependencia}</p>
                  {(t.costo || t.plazo) && (
                    <p className="text-xs text-content-3 mt-0.5">
                      {t.costo && <span>Costo: {t.costo}</span>}
                      {t.costo && t.plazo && " · "}
                      {t.plazo && <span>Plazo: {t.plazo}</span>}
                    </p>
                  )}
                </div>
                <AplicabilidadBadge valor={t.aplicabilidad} />
              </li>
            ))}
          </ul>
          <p className="text-xs text-content-3 mt-3 italic">
            Los requisitos regulatorios deben confirmarse directamente con la autoridad competente antes de iniciar operaciones.
            Consulta el RETyS oficial en{" "}
            <a href="https://retys.bajacalifornia.gob.mx" target="_blank" rel="noopener noreferrer" className="underline hover:text-content">
              retys.bajacalifornia.gob.mx
            </a>.
          </p>
        </div>
      )}

      {/* Siguientes pasos */}
      {pasos.length > 0 && (
        <div className="bg-surface rounded-xl border border-border p-5 print-break-avoid">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck size={16} className="text-brand-strong" aria-hidden="true" />
            <h3 className="text-sm font-semibold text-content">Siguientes Pasos Recomendados</h3>
          </div>
          <ol className="space-y-3">
            {pasos.map((rec, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="shrink-0 w-5 h-5 rounded-full bg-brand-soft text-brand-strong text-xs font-bold flex items-center justify-center mt-0.5" aria-hidden="true">
                  {i + 1}
                </span>
                <span className="text-sm text-content-2">{rec}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Card CTA — Hablar con el Agente IA */}
      <div className="bg-brand-soft rounded-xl border border-brand-soft-border p-5 no-print">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-brand-soft flex items-center justify-center shrink-0" aria-hidden="true">
            <MessageCircle size={20} className="text-brand-strong" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-content">¿Quieres profundizar el análisis?</p>
            <p className="text-xs text-content-2 mt-0.5">
              El Agente IA conoce los 242 trámites del RETyS de Baja California y puede responderte preguntas específicas sobre tu negocio.
            </p>
          </div>
          <button
            type="button"
            onClick={onAbrirChat}
            className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-brand-700 text-white text-sm font-medium rounded-lg hover:bg-brand-800 transition-all"
          >
            <MessageCircle size={15} aria-hidden="true" />
            Preguntar al Agente
          </button>
        </div>
      </div>

      {/* Nota metodológica del agente */}
      {!esSimulacion && notaMetodologica && (
        <div className="rounded-xl border p-4 bg-surface border-border">
          <p className="text-xs text-content-3 leading-relaxed">{notaMetodologica}</p>
        </div>
      )}

      {/* Power BI Embed (solo cuando la integración está configurada) */}
      {powerBiEmbedUrl && (
        <div className="bg-surface rounded-xl border border-border overflow-hidden no-print">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border">
            <span className="text-sm font-semibold text-content">Reporte Power BI</span>
            <a
              href={powerBiEmbedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-brand-strong hover:underline"
            >
              Abrir en nueva pestaña <ExternalLink size={11} aria-hidden="true" />
            </a>
          </div>
          <div className="aspect-video bg-surface-2">
            <iframe
              title="Reporte de viabilidad Power BI"
              src={powerBiEmbedUrl}
              className="w-full h-full border-0"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  );
}
