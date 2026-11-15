import { Logo, WhatsIcon } from "./components/Brand";
import { LINK_ATIVAR, LINK_CHECKOUT_ANUAL, LINK_CHECKOUT_MENSAL, LINK_PRIVACIDADE, LINK_TERMOS, WHATSAPP_TRIAL_INTERNATIONAL, isPending } from "./config";
import { internationalCopy } from "./internationalCopy";
import { rastrearCheckout } from "./pixel";

export function International({ idioma }: { idioma: "en" | "es" }) {
  const t = internationalCopy[idioma];
  const whatsapp = WHATSAPP_TRIAL_INTERNATIONAL[idioma];
  const button = "inline-flex items-center justify-center gap-2 rounded-full bg-salvia-700 px-6 py-3.5 font-semibold text-marfim hover:bg-salvia-900 focus-visible:outline-2 focus-visible:outline-offset-2";
  return (
    <>
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:z-[60] focus:bg-marfim focus:p-4">
        {idioma === "en" ? "Skip to content" : "Saltar al contenido"}
      </a>
      <header className="border-b border-salvia-100 bg-marfim">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <a href="#inicio" aria-label="Leviã"><Logo /></a>
          <a href="#planos" className="font-semibold text-salvia-900 underline underline-offset-4">{t.plans}</a>
        </div>
      </header>
      <p className="mx-auto max-w-6xl px-5 pt-4 text-sm text-carvao/75">{t.cookieNotice}</p>
      <main id="conteudo">
        <section id="inicio" className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 md:grid-cols-2 md:py-24">
          <div>
            <h1 className="font-serif text-5xl leading-tight text-salvia-900 md:text-7xl">{t.title}</h1>
            <p className="mt-6 text-lg leading-relaxed text-carvao/80">{t.intro}</p>
            <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={`${button} mt-8`}><WhatsIcon className="h-5 w-5" />{t.trial}</a>
            <p className="mt-4 text-sm text-carvao/70">{t.trialDetail}</p>
          </div>
          <img src="/images/prato-brasileiro.jpg" alt={t.image} className="w-full rounded-[2.5rem] object-cover shadow-xl" />
        </section>
        <section className="bg-salvia-50 px-5 py-20">
          <div className="mx-auto max-w-6xl">
            <h2 className="font-serif text-4xl text-salvia-900">{t.featuresTitle}</h2>
            <div className="mt-10 grid gap-5 md:grid-cols-2">
              {t.features.map(([title, text]) => <article key={title} className="rounded-3xl bg-marfim p-7 ring-1 ring-salvia-100">
                <h3 className="font-serif text-2xl text-salvia-900">{title}</h3><p className="mt-3 leading-relaxed">{text}</p>
              </article>)}
            </div>
            <p className="mt-8 text-sm">{t.disclaimer}</p>
          </div>
        </section>
        <section id="planos" className="mx-auto max-w-5xl px-5 py-20">
          <h2 className="font-serif text-4xl text-salvia-900">{t.plans}</h2>
          <p className="mt-4">{t.trialDetail}</p>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {([[t.monthly, LINK_CHECKOUT_MENSAL, "mensal", 19.97], [t.annual, LINK_CHECKOUT_ANUAL, "anual", 191.71]] as const).map(([label, url, plano, valor]) =>
              <article key={plano} className="rounded-3xl bg-white p-7 ring-1 ring-salvia-100">
                <h3 className="font-serif text-2xl text-salvia-900">{label}</h3>
                {!isPending(url) && <a href={url} target="_blank" rel="noopener noreferrer" onClick={() => rastrearCheckout(plano, valor)} className={`${button} mt-5`}>{t.checkout}</a>}
              </article>)}
          </div>
          <p className="mt-8">{t.activationDetail}</p>
          <a href={LINK_ATIVAR} className="mt-3 inline-block font-semibold text-salvia-700 underline underline-offset-4">{t.activation}</a>
        </section>
        <section className="bg-salvia-50 px-5 py-20">
          <div className="mx-auto max-w-4xl">
            <h2 className="font-serif text-4xl text-salvia-900">{t.faqTitle}</h2>
            {t.faq.map(([question, answer]) => <details key={question} className="mt-4 rounded-2xl bg-marfim p-5">
              <summary className="cursor-pointer font-semibold text-salvia-900">{question} <span aria-hidden="true">+</span></summary>
              <p className="mt-3">{answer}</p>
            </details>)}
            <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={`${button} mt-8`}>{t.contact}</a>
          </div>
        </section>
      </main>
      <footer className="bg-salvia-900 px-5 py-10 text-marfim">
        <div className="mx-auto max-w-6xl">
          <Logo light />
          <div className="mt-5 flex flex-wrap gap-5 text-sm underline underline-offset-4">
            <a href={LINK_PRIVACIDADE} hrefLang="pt-BR">{t.privacy}</a>
            <a href={LINK_TERMOS} hrefLang="pt-BR">{t.terms}</a>
            <button type="button" onClick={() => window.dispatchEvent(new Event("levia:pixel-prefs"))}>{t.cookieSettings}</button>
          </div>
        </div>
      </footer>
    </>
  );
}
