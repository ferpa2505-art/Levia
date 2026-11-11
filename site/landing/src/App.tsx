import { useEffect, useState } from "react";
import { Header, Hero, TrialExplainer, Momento, Recursos, ComoFunciona } from "./components/SectionsTop";
import { Glp1, Diabetes, Planos, Telas, Video, Faq, Privacidade, CtaFinal, Contato, Footer } from "./components/SectionsBottom";
import { WhatsIcon } from "./components/Brand";
import { ConsentimentoPixel } from "./components/ConsentimentoPixel";
import { iniciarPixel } from "./pixel";
import { WHATSAPP_TRIAL } from "./config";

function MobileCta() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 700);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-salvia-100 bg-marfim/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur transition-transform md:hidden ${show ? "translate-y-0" : "translate-y-full"}`}
    >
      <a href={WHATSAPP_TRIAL} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-full bg-salvia-700 py-3.5 font-semibold text-marfim">
        <WhatsIcon className="h-5 w-5" /> Começar teste grátis de 7 dias
      </a>
    </div>
  );
}

export default function App() {
  useEffect(() => {
    iniciarPixel();
  }, []);

  return (
    <>
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-white focus:px-4 focus:py-2">
        Pular para o conteúdo
      </a>
      <Header />
      <main id="conteudo">
        <Hero />
        <TrialExplainer />
        <Momento />
        <Recursos />
        <ComoFunciona />
        <Glp1 />
        <Diabetes />
        <Planos />
        <Telas />
        <Video />
        <Faq />
        <Privacidade />
        <CtaFinal />
        <Contato />
      </main>
      <Footer />
      <MobileCta />
      <ConsentimentoPixel />
    </>
  );
}
