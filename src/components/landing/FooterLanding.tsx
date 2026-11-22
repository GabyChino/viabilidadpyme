import Link from "next/link";
import { BarChart3 } from "lucide-react";

export function FooterLanding() {
  return (
    <footer className="bg-surface py-12 px-4 sm:px-6 border-t border-border">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 pb-10 border-b border-border">

          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
                <BarChart3 size={16} className="text-white" />
              </div>
              <div>
                <span className="text-sm font-bold text-content block leading-none">PYME Digital</span>
                <span className="text-[10px] text-brand-strong block mt-0.5">Tijuana, Baja California</span>
              </div>
            </Link>
            <p className="text-sm leading-relaxed text-content-3 max-w-xs">
              Plataforma gratuita con inteligencia artificial para que los comerciantes
              de Tijuana protejan, conozcan y formalicen su negocio.
            </p>
            <p className="text-xs text-content-3 mt-3 leading-relaxed">
              Basada en los trámites oficiales del RETyS de Baja California.
            </p>
          </div>

          {/* Módulos */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-widest text-content-3 mb-4">Módulos</h4>
            <ul className="space-y-2.5">
              {[
                { href: "#modulos", label: "01 · Potencial Comercial"  },
                { href: "#modulos", label: "02 · Tramitómetro"         },
                { href: "#modulos", label: "03 · Beneficios y Crédito" },
                { href: "#para-quien", label: "¿Para quién es?"        },
              ].map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="text-sm text-content-3 hover:text-content transition-colors">{l.label}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Fuentes */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-widest text-content-3 mb-4">Fuentes de datos</h4>
            <ul className="space-y-2.5">
              {[
                { href: "https://www.inegi.org.mx/app/mapa/denue/",          label: "INEGI / DENUE"              },
                { href: "https://retys.bajacalifornia.gob.mx",                label: "RETyS Baja California"      },
                { href: "https://www.openstreetmap.org",                      label: "OpenStreetMap"              },
                { href: "https://www.nafin.com",                               label: "NAFIN"                      },
              ].map((l) => (
                <li key={l.href}>
                  <a href={l.href} target="_blank" rel="noopener noreferrer" className="text-sm text-content-3 hover:text-content transition-colors">{l.label} ↗</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Plataforma */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-widest text-content-3 mb-4">Plataforma</h4>
            <ul className="space-y-2.5">
              {[
                { href: "/analizar",   label: "Iniciar diagnóstico" },
                { href: "#como-funciona", label: "Cómo funciona"     },
                { href: "#modulos",    label: "Módulos de análisis" },
                { href: "#para-quien", label: "¿Para quién es?"     },
                { href: "#fuentes",    label: "Fuentes de datos"    },
                { href: "/privacidad", label: "Aviso de privacidad" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-content-3 hover:text-content transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-content-3">
            © {new Date().getFullYear()} PYME Digital México · Plataforma gratuita de apoyo al comerciante
          </p>
          <p className="text-sm text-content-3">
            Datos: RETyS Baja California · INEGI · OpenStreetMap · IBM watsonx
          </p>
        </div>
      </div>
    </footer>
  );
}
