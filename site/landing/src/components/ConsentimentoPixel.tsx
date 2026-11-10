import { useEffect, useState } from "react";
import { LINK_PRIVACIDADE } from "../config";
import { definirConsentimento, lerConsentimento, limparConsentimento, pixelConfigurado } from "../pixel";

/** Aviso de cookies de medição: o pixel só carrega depois do aceite. */
export function ConsentimentoPixel() {
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    setVisivel(pixelConfigurado() && lerConsentimento() === null);
    const abrirPreferencias = () => {
      limparConsentimento();
      setVisivel(true);
    };
    window.addEventListener("levia:pixel-prefs", abrirPreferencias);
    return () => window.removeEventListener("levia:pixel-prefs", abrirPreferencias);
  }, []);

  if (!visivel) return null;

  const escolher = (valor: "granted" | "denied") => {
    definirConsentimento(valor);
    setVisivel(false);
  };

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Preferências de cookies"
      className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-xl rounded-2xl bg-marfim p-5 text-sm shadow-2xl ring-1 ring-salvia-100 md:bottom-6"
    >
      <p className="font-semibold text-salvia-900">Cookies de medição</p>
      <p className="mt-1 text-carvao/75">
        Com o seu consentimento, usamos o pixel da Meta para medir visitas e cliques no checkout. Nenhum dado de saúde é
        enviado. Você pode recusar e continuar navegando normalmente.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => escolher("granted")}
          className="rounded-full bg-salvia-700 px-5 py-2.5 font-semibold text-marfim hover:bg-salvia-900"
        >
          Aceitar
        </button>
        <button
          type="button"
          onClick={() => escolher("denied")}
          className="rounded-full border border-salvia-300 px-5 py-2.5 font-semibold text-salvia-900 hover:bg-salvia-50"
        >
          Recusar
        </button>
        <a
          href={LINK_PRIVACIDADE}
          target="_blank"
          rel="noopener noreferrer"
          className="px-2 py-2.5 font-medium text-salvia-700 underline underline-offset-2"
        >
          Política de privacidade
        </a>
      </div>
    </div>
  );
}
