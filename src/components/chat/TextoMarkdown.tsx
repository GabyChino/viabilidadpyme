import { Fragment, type ReactNode } from "react";

/**
 * Renderiza el subconjunto de Markdown que usan las respuestas del chat:
 * **negrita**, [enlaces](url), URLs sueltas, encabezados (#), listas
 * (•, -, *, 1.), tablas con | y separadores ---.
 * No usa dangerouslySetInnerHTML: todo se construye como elementos React.
 */

const INLINE = /(\*\*[^*]+\*\*|\[[^\]]+\]\(https?:\/\/[^\s)]+\)|https?:\/\/[^\s)<>|]+)/g;

function Enlace({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-brand-strong underline underline-offset-2 break-words hover:opacity-80"
    >
      {children}
    </a>
  );
}

function renderInline(texto: string): ReactNode[] {
  return texto.split(INLINE).map((seg, i) => {
    if (!seg) return null;
    if (seg.startsWith("**") && seg.endsWith("**")) {
      return <strong key={i}>{seg.slice(2, -2)}</strong>;
    }
    const link = seg.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/);
    if (link) return <Enlace key={i} href={link[2]}>{link[1]}</Enlace>;
    if (/^https?:\/\//.test(seg)) {
      // No incluir puntuación final en el enlace
      const limpio = seg.replace(/[.,;:]+$/, "");
      return (
        <Fragment key={i}>
          <Enlace href={limpio}>{limpio}</Enlace>
          {seg.slice(limpio.length)}
        </Fragment>
      );
    }
    return <Fragment key={i}>{seg}</Fragment>;
  });
}

function esFilaTabla(linea: string) {
  return /^\s*\|.*\|\s*$/.test(linea);
}

function celdas(linea: string): string[] {
  return linea.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
}

function Tabla({ lineas }: { lineas: string[] }) {
  const filas = lineas.filter((l) => !/^\s*\|?\s*:?-{2,}/.test(l)).map(celdas);
  const [encabezado, ...cuerpo] = filas;
  return (
    <div className="overflow-x-auto my-1.5">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr>
            {encabezado.map((c, i) => (
              <th key={i} className="border border-border px-2 py-1 font-semibold bg-surface-2">
                {renderInline(c)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cuerpo.map((fila, i) => (
            <tr key={i}>
              {fila.map((c, j) => (
                <td key={j} className="border border-border px-2 py-1 align-top">
                  {renderInline(c.replace(/<br\s*\/?>/gi, " · "))}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function TextoMarkdown({ texto }: { texto: string }) {
  const lineas = texto.split("\n");
  const bloques: ReactNode[] = [];

  for (let i = 0; i < lineas.length; i++) {
    const linea = lineas[i];

    if (esFilaTabla(linea)) {
      const grupo: string[] = [];
      while (i < lineas.length && esFilaTabla(lineas[i])) grupo.push(lineas[i++]);
      i--;
      bloques.push(<Tabla key={`t${i}`} lineas={grupo} />);
      continue;
    }

    if (/^\s*-{3,}\s*$/.test(linea)) {
      bloques.push(<hr key={i} className="my-2 border-border" />);
      continue;
    }

    const encabezado = linea.match(/^\s*#{1,6}\s+(.*)$/);
    if (encabezado) {
      bloques.push(<p key={i} className="font-semibold mt-1">{renderInline(encabezado[1])}</p>);
      continue;
    }

    const vineta = linea.match(/^\s*(?:[•*-]|(\d+)\.)\s+(.*)$/);
    if (vineta) {
      bloques.push(
        <div key={i} className="flex gap-1.5 pl-1">
          <span className="shrink-0 text-content-3">{vineta[1] ? `${vineta[1]}.` : "•"}</span>
          <span className="min-w-0">{renderInline(vineta[2])}</span>
        </div>
      );
      continue;
    }

    bloques.push(
      linea.trim() === ""
        ? <div key={i} className="h-2" />
        : <p key={i}>{renderInline(linea)}</p>
    );
  }

  return <div className="space-y-0.5 break-words">{bloques}</div>;
}
