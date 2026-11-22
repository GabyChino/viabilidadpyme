import { NavbarLanding }          from "@/components/landing/NavbarLanding";
import { HeroSection }             from "@/components/landing/HeroSection";
import { FranjaFuentes }           from "@/components/landing/FranjaFuentes";
import { ComoFuncionaSection }     from "@/components/landing/ComoFuncionaSection";
import { ContextoSection }         from "@/components/landing/ContextoSection";
import { ModulosSection }          from "@/components/landing/ModulosSection";
import { ParaQuienSection }        from "@/components/landing/ParaQuienSection";
import { FuentesDatosSection }     from "@/components/landing/FuentesDatosSection";
import { CtaFinalSection }         from "@/components/landing/CtaFinalSection";
import { FooterLanding }           from "@/components/landing/FooterLanding";

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <NavbarLanding />
      <HeroSection />
      <FranjaFuentes />
      <ComoFuncionaSection />
      <ContextoSection />
      <ModulosSection />
      <ParaQuienSection />
      <FuentesDatosSection denueActivo={!!process.env.INEGI_DENUE_TOKEN} />
      <CtaFinalSection />
      <FooterLanding />
    </div>
  );
}
