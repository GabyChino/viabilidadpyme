import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export const metadata: Metadata = {
  title: "Aviso de privacidad",
  description: "Cómo Viabilidad PYME trata los datos que capturas al analizar tu negocio.",
};

// Datos del responsable: completar antes de publicar el sitio
const RESPONSABLE = "[Nombre o razón social del responsable]";
const DOMICILIO = "[Domicilio completo]";
const CORREO = "[correo de contacto para privacidad]";
const FECHA_ACTUALIZACION = "21 de noviembre de 2026";

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-semibold text-content">{titulo}</h2>
      <div className="flex flex-col gap-2 text-sm text-content-2 leading-relaxed">{children}</div>
    </section>
  );
}

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-surface-2">
      <header className="border-b border-border bg-surface">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1.5 text-sm text-content-3 hover:text-content">
            <ArrowLeft size={15} aria-hidden="true" /> Inicio
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10 flex flex-col gap-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-content">Aviso de privacidad</h1>
          <p className="text-sm text-content-3 mt-2">Última actualización: {FECHA_ACTUALIZACION}</p>
        </div>

        <Seccion titulo="Responsable">
          <p>
            {RESPONSABLE}, con domicilio en {DOMICILIO}, es responsable del tratamiento de los datos que
            proporcionas en Viabilidad PYME, conforme a la Ley Federal de Protección de Datos Personales en
            Posesión de los Particulares.
          </p>
        </Seccion>

        <Seccion titulo="Qué datos usamos">
          <p>Para generar el diagnóstico usamos únicamente lo que capturas en el formulario:</p>
          <ul className="list-disc pl-5 flex flex-col gap-1">
            <li>Datos del negocio: nombre, giro, descripción, colonia y modelo de negocio.</li>
            <li>Rangos de capital, ventas, número de personas que trabajan y experiencia.</li>
            <li>Si tu negocio ya opera: tiempo en operación, situación formal y reto principal.</li>
            <li>Si lo eliges en el mapa: sus datos públicos (dirección, categoría, horarios, sitio web).</li>
          </ul>
          <p>
            No pedimos nombre de personas, teléfono, correo, RFC ni datos sensibles. No uses la descripción
            del negocio para escribir datos personales de terceros.
          </p>
        </Seccion>

        <Seccion titulo="Para qué los usamos">
          <ul className="list-disc pl-5 flex flex-col gap-1">
            <li>Generar el análisis de viabilidad, los trámites aplicables y las recomendaciones.</li>
            <li>Responder tus preguntas en el chat del asesor.</li>
            <li>Medir el funcionamiento del servicio con estadísticas que no incluyen tus datos capturados.</li>
          </ul>
        </Seccion>

        <Seccion titulo="Con quién se comparten">
          <ul className="list-disc pl-5 flex flex-col gap-1">
            <li>
              <strong className="text-content">IBM Cloud (watsonx Orchestrate y watsonx.ai)</strong>: procesa los datos
              del formulario para generar el análisis y las respuestas del chat. Sus servidores pueden estar fuera
              de México.
            </li>
            <li>
              <strong className="text-content">INEGI (DENUE) y OpenStreetMap</strong>: reciben el texto que buscas y la
              ubicación aproximada para consultar negocios públicos y la competencia cercana.
            </li>
            <li>
              <strong className="text-content">Sitio web de tu negocio</strong>: si lo eliges en el mapa y tiene página,
              la consultamos para leer su información pública.
            </li>
          </ul>
          <p>No vendemos ni compartimos tus datos con otros fines.</p>
        </Seccion>

        <Seccion titulo="Dónde se guardan">
          <p>
            Tu último análisis y el formulario sin terminar se guardan solo en tu navegador, para que puedas
            continuar después. Puedes borrarlos con el botón &laquo;Descartar&raquo; o &laquo;Empezar de nuevo&raquo;, o
            limpiando los datos del sitio en tu navegador. Nuestros servidores no conservan el contenido de tus
            análisis más allá de lo necesario para generarlos.
          </p>
        </Seccion>

        <Seccion titulo="Tus derechos">
          <p>
            Puedes acceder, rectificar, cancelar u oponerte al tratamiento de tus datos (derechos ARCO), así
            como revocar tu consentimiento, escribiendo a {CORREO}. Te responderemos en los plazos que marca la
            ley.
          </p>
        </Seccion>

        <Seccion titulo="Cambios a este aviso">
          <p>Publicaremos cualquier cambio en esta misma página, con su fecha de actualización.</p>
        </Seccion>
      </main>
    </div>
  );
}
