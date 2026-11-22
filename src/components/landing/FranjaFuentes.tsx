import { ClipboardList, BarChart2, Map, Cpu, Target, FileCheck, MapPin, MessageCircle } from "lucide-react";

const ELEMENTOS = [
  { Icono: ClipboardList, texto: "RETyS Baja California" },
  { Icono: BarChart2, texto: "INEGI · DENUE" },
  { Icono: Map, texto: "OpenStreetMap" },
  { Icono: Cpu, texto: "IBM watsonx" },
  { Icono: Target, texto: "Modelo de 10 criterios" },
  { Icono: FileCheck, texto: "242 fichas oficiales" },
  { Icono: MapPin, texto: "Competencia a 800 m" },
  { Icono: MessageCircle, texto: "Chat con asesor IA" },
];

/** Franja de fuentes y capacidades que se desplaza sin fin (se pausa al pasar el mouse). */
export function FranjaFuentes() {
  return (
    <div
      className="relative py-5 border-y border-border bg-surface overflow-hidden"
      style={{ maskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)" }}
    >
      <ul className="flex w-max animar-franja" aria-label="Fuentes y capacidades">
        {/* Dos copias seguidas para que el desplazamiento no tenga cortes */}
        {[0, 1].map((copia) =>
          ELEMENTOS.map(({ Icono, texto }) => (
            <li
              key={`${copia}-${texto}`}
              aria-hidden={copia === 1}
              className="flex items-center gap-2 px-6 text-sm font-semibold text-content-2 whitespace-nowrap"
            >
              <Icono size={17} className="text-brand-strong" aria-hidden="true" />
              {texto}
              <span className="ml-6 w-1 h-1 rounded-full bg-border" aria-hidden="true" />
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
