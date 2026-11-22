import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FondoAnimado } from "@/components/landing/efectos";

export function CtaFinalSection() {
  return (
    <section className="relative py-20 px-4 sm:px-6 bg-brand-600 dark:bg-brand-900 dark:border-y dark:border-brand-800 overflow-hidden">
      <FondoAnimado intenso />
      <div className="relative max-w-3xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white">
          ¿Listo para conocer la viabilidad de tu negocio?
        </h2>
        <p className="mt-3 text-lg text-brand-100">Gratis, sin registro y en menos de un minuto.</p>

        <Link
          href="/analizar"
          className="group mt-8 inline-flex items-center justify-center gap-2 px-8 py-4 bg-white hover:bg-brand-50 text-brand-800 font-bold rounded-xl transition-all text-base shadow-xl hover:-translate-y-0.5"
        >
          Iniciar diagnóstico gratis
          <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
