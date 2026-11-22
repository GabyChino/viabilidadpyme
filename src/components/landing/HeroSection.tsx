import Link from "next/link";
import { ArrowRight, BadgeCheck, Clock, UserX } from "lucide-react";
import { DemoAnimada } from "@/components/landing/DemoAnimada";
import { FondoAnimado, PalabraRotativa } from "@/components/landing/efectos";

export function HeroSection() {
  return (
    <section className="relative pt-28 pb-20 bg-surface-2 overflow-hidden">
      <FondoAnimado />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

        <div className="animate-fade-left">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-soft-border bg-brand-soft text-xs font-semibold text-brand-strong">
            <span className="relative flex w-2 h-2">
              <span className="absolute inline-flex w-full h-full rounded-full bg-brand-500 animar-pulso" />
              <span className="relative inline-flex w-2 h-2 rounded-full bg-brand-500" />
            </span>
            Tijuana, Baja California
          </span>

          <h1 className="mt-5 text-4xl sm:text-5xl lg:text-[3.4rem] font-bold text-content leading-[1.1] tracking-tight">
            Diagnóstico de viabilidad para tu{" "}
            <span className="text-brand-strong">
              <PalabraRotativa palabras={["taquería", "farmacia", "estética", "idea", "negocio"]} />
            </span>
          </h1>

          <p className="mt-5 text-lg text-content-2 leading-relaxed max-w-md">
            Busca tu negocio, la IA llena el formulario y recibes trámites, competencia y riesgos en menos de un minuto.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link
              href="/analizar"
              className="group inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-brand-600/25 hover:shadow-brand-600/40 hover:-translate-y-0.5"
            >
              Iniciar diagnóstico gratis
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
            <a
              href="#como-funciona"
              className="inline-flex items-center justify-center px-7 py-3.5 border border-border hover:border-brand-500 text-content-2 hover:text-content font-medium rounded-xl transition-colors bg-surface"
            >
              Ver cómo funciona
            </a>
          </div>

          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-content-2">
            {[
              { Icono: BadgeCheck, texto: "Gratis" },
              { Icono: UserX, texto: "Sin registro" },
              { Icono: Clock, texto: "Menos de 1 minuto" },
            ].map(({ Icono, texto }) => (
              <li key={texto} className="flex items-center gap-1.5">
                <Icono size={16} className="text-brand-strong" aria-hidden="true" />
                {texto}
              </li>
            ))}
          </ul>
        </div>

        <div className="animate-fade-right lg:pl-6">
          <DemoAnimada />
        </div>
      </div>
    </section>
  );
}
