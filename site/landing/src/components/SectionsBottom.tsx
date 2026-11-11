import { useState } from "react";
import { Logo, Check, WhatsIcon } from "./Brand";
import { PhoneMockup, type Variant } from "./PhoneMockup";
import { TrialButton } from "./SectionsTop";
import { pixelConfigurado, rastrearCheckout } from "../pixel";
import {
  LINK_CHECKOUT_MENSAL,
  LINK_CHECKOUT_ANUAL,
  LINK_ATIVAR,
  LINK_ATIVAR_LABEL,
  LINK_PRIVACIDADE,
  LINK_TERMOS,
  EMAIL_CONTATO,
  YOUTUBE_ID,
  isPending,
  whatsappWithText,
} from "../config";

export function Glp1() {
  const items = ["Calculadora de Clique GLP-1¹", "Controle de doses e lembretes", "Registro de apetite", "Registro de efeitos", "Acompanhamento de peso"];
  return (
    <section id="glp1" className="bg-salvia-50 py-20 md:py-28">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 md:grid-cols-2 md:items-center">
        <div>
          <p className="eyebrow">Um novo capítulo, com apoio</p>
          <h2 className="mt-3 font-serif text-4xl leading-tight text-salvia-900 md:text-5xl">
            Você toma Ozempic, emagrece, mas não sabe o que comer?
          </h2>
          <p className="mt-5 text-lg text-carvao/75">
            Quando a rotina fica difícil, é fácil desanimar. Você não precisa enfrentar isso sem apoio.
          </p>
          <p className="mt-3 text-lg text-carvao/75">
            O Leviã entende GLP-1: volume pequeno, proteína alta e comida brasileira de verdade.
          </p>
          <TrialButton className="mt-8">Quero testar 7 dias grátis</TrialButton>
          <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-pessego-100 px-4 py-2 text-sm font-medium text-carvao">
            ⚕️ Medicação e ajustes de dose: sempre com seu médico.
          </p>
        </div>
        <div className="rounded-[2rem] bg-white p-6 shadow-sm md:p-8">
          <ol className="divide-y divide-salvia-100">
            {items.map((t, i) => (
              <li key={t} className="flex items-center gap-4 py-4">
                <span className="font-serif text-2xl text-pessego-500">{String(i + 1).padStart(2, "0")}</span>
                <span className="font-medium text-salvia-900">{t}</span>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-xs text-carvao/60">¹ Ferramenta de registro e referência, não prescrição. Nunca ajuste uma dose por conta própria.</p>
        </div>
      </div>
    </section>
  );
}

export function Diabetes() {
  const items = ["Controle de carboidratos", "Registro de glicemia", "Faixa-alvo de glicemia e lembretes", "Refeições e glicemia lado a lado", "Relatórios para levar ao médico"];
  return (
    <section id="diabetes" className="mx-auto max-w-6xl px-5 py-20 md:py-28">
      <div className="grid gap-12 md:grid-cols-2 md:items-center">
        <div className="order-2 rounded-[2rem] bg-pessego-100 p-7 md:order-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-pessego-700">Cuidado em cada escolha</p>
          <h3 className="mt-2 font-serif text-3xl text-salvia-900">Uma refeição. Mais contexto.</h3>
          <div className="mt-6 rounded-2xl bg-white p-5">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-carvao/50">Glicemia registrada · exemplo</p>
            <p className="mt-1 font-serif text-3xl text-salvia-900">108 mg/dL</p>
            <svg viewBox="0 0 300 70" className="mt-3 w-full" aria-hidden>
              <path d="M0 50 C30 50 40 20 70 22 S110 52 140 48 S180 18 210 24 S260 50 300 44" fill="none" stroke="#6FA58E" strokeWidth="3" strokeLinecap="round" />
              <circle cx="70" cy="22" r="5" fill="#F4A983" />
              <circle cx="210" cy="24" r="5" fill="#F4A983" />
            </svg>
            <p className="mt-2 text-sm text-carvao/70">Refeições e registros, lado a lado.</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium">
            {["Carboidratos", "Glicemia", "Rotina"].map((t) => (
              <span key={t} className="rounded-full bg-white px-3 py-1.5">{t}</span>
            ))}
          </div>
        </div>
        <div className="order-1 md:order-2">
          <p className="eyebrow">A sua rotina importa</p>
          <h2 className="mt-3 font-serif text-4xl leading-tight text-salvia-900 md:text-5xl">Você tem diabetes tipo 1 ou 2?</h2>
          <p className="mt-5 text-lg text-carvao/75">
            O Leviã tem um módulo específico para você. Para entender suas refeições e levar mais contexto às consultas.
          </p>
          <ul className="mt-6 space-y-3">
            {items.map((t) => (
              <li key={t} className="flex items-center gap-3">
                <Check className="h-5 w-5 shrink-0 text-salvia-700" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
          <TrialButton className="mt-8">Conhecer o módulo Diabetes</TrialButton>
          <p className="mt-4 text-sm text-carvao/60">O Leviã não substitui acompanhamento médico ou nutricional.</p>
        </div>
      </div>
    </section>
  );
}

const planFeatures = ["Análise de refeições com IA", "Módulos GLP-1 e Diabetes", "Macros, hábitos e diário completo", "Relatórios semanais e mensais", "Todos os recursos do Leviã"];

function PlanCard({ highlight, tag, name, price, per, perDay, note, href, cta, plano, valor }: {
  highlight?: boolean; tag?: string; name: string; price: string; per: string; perDay: string; note: string; href: string; cta: string;
  plano: "mensal" | "anual"; valor: number;
}) {
  const pending = isPending(href);
  return (
    <div className={`relative flex flex-col rounded-[2rem] p-8 ${highlight ? "bg-salvia-900 text-marfim shadow-2xl shadow-salvia-900/25" : "bg-white ring-1 ring-salvia-100"}`}>
      {tag && (
        <span className="absolute -top-3 left-8 rounded-full bg-pessego-500 px-3 py-1 text-xs font-bold tracking-wide text-salvia-900">{tag}</span>
      )}
      <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${highlight ? "text-pessego-300" : "text-salvia-700"}`}>{name}</p>
      <p className="mt-3 font-serif text-5xl">
        {price}
        <span className={`font-sans text-base ${highlight ? "text-marfim/70" : "text-carvao/60"}`}>{per}</span>
      </p>
      <p className={`mt-1 text-sm ${highlight ? "text-marfim/75" : "text-carvao/70"}`}>{perDay}</p>
      <ul className="mt-6 flex-1 space-y-3">
        {planFeatures.map((f) => (
          <li key={f} className="flex items-center gap-3 text-[15px]">
            <Check className={`h-5 w-5 shrink-0 ${highlight ? "text-pessego-300" : "text-salvia-700"}`} />
            {f}
          </li>
        ))}
      </ul>
      {pending ? (
        <span
          aria-disabled="true"
          className={`mt-8 block cursor-not-allowed rounded-full px-6 py-3.5 text-center font-semibold opacity-70 ${highlight ? "bg-marfim/20 text-marfim" : "bg-salvia-100 text-salvia-900"}`}
        >
          Checkout em breve
        </span>
      ) : (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => rastrearCheckout(plano, valor)}
          className={`mt-8 block rounded-full px-6 py-3.5 text-center font-semibold transition ${highlight ? "bg-pessego-500 text-salvia-900 hover:bg-pessego-300" : "bg-salvia-700 text-marfim hover:bg-salvia-900"}`}
        >
          {cta}
        </a>
      )}
      <p className={`mt-3 text-center text-xs ${highlight ? "text-marfim/60" : "text-carvao/55"}`}>{note}</p>
    </div>
  );
}

export function Planos() {
  return (
    <section id="planos" className="bg-white/60 py-20 md:py-28">
      <div className="mx-auto max-w-5xl px-5">
        <div className="text-center">
          <p className="eyebrow">Invista em você, sem complicar</p>
          <h2 className="mt-3 font-serif text-4xl text-salvia-900 md:text-5xl">Um cuidado que cabe no seu dia.</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-carvao/75">Comece com 7 dias grátis. Depois, escolha o plano que combina com o seu ritmo.</p>
        </div>

        <div className="mx-auto mt-10 flex max-w-3xl flex-col items-center gap-4 rounded-[1.75rem] bg-salvia-50 p-6 text-center ring-1 ring-salvia-100 md:flex-row md:text-left">
          <div className="flex-1">
            <p className="font-serif text-2xl text-salvia-900">Teste grátis · 7 dias</p>
            <p className="mt-1 text-sm text-carvao/70">2 análises de prato por IA. A contagem começa na ativação do serial. Sem cartão.</p>
          </div>
          <TrialButton className="shrink-0">Começar teste grátis</TrialButton>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <PlanCard
            name="Plano mensal"
            price="R$ 19,97"
            per="/mês"
            perDay="R$ 0,66 por dia · 30 dias de acesso"
            href={LINK_CHECKOUT_MENSAL}
            cta="Assinar plano mensal"
            note="Pagamento seguro pela Hotmart"
            plano="mensal"
            valor={19.97}
          />
          <PlanCard
            highlight
            tag="20% OFF"
            name="Plano anual"
            price="R$ 191,71"
            per="/ano"
            perDay="R$ 0,52 por dia · 365 dias de acesso"
            href={LINK_CHECKOUT_ANUAL}
            cta="Assinar plano anual"
            note="Pagamento seguro pela Hotmart"
            plano="anual"
            valor={191.71}
          />
        </div>
        <p className="mx-auto mt-8 max-w-2xl text-center text-sm leading-relaxed text-carvao/75">
          Pague a qualquer momento durante o teste. Após a confirmação do pagamento, você recebe no WhatsApp o serial do seu plano: 30 dias (mensal) ou 365 dias (anual).
        </p>
        <p className="mt-3 text-center text-xs text-carvao/60">
          Ao assinar, você concorda com os{" "}
          <a href={LINK_TERMOS} target="_blank" rel="noopener noreferrer" className="font-semibold text-salvia-700 underline underline-offset-2">Termos de Serviço</a>
          .
        </p>
        <p className="mt-3 text-center text-xs text-carvao/55">
          O Leviã funciona no navegador (PWA). Não está na App Store nem na Play Store.
        </p>
      </div>
    </section>
  );
}

export function Telas() {
  const screens: [Variant, string][] = [
    ["hoje", "Seu dia em equilíbrio"],
    ["diario", "Um diário sem julgamentos"],
    ["prato", "Uma foto. Muitos nutrientes."],
    ["semana", "Pequenas vitórias, visíveis."],
  ];
  return (
    <section id="telas" className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5 text-center">
        <p className="eyebrow">Um pouco do que vem por aí</p>
        <h2 className="mt-3 font-serif text-4xl text-salvia-900 md:text-5xl">Seu cuidado, na palma da mão.</h2>
        <p className="mt-4 text-carvao/70">Prévia das telas, imagens ilustrativas da experiência.</p>
      </div>
      <div className="mt-12 flex snap-x snap-mandatory gap-6 overflow-x-auto px-5 pb-6 lg:mx-auto lg:max-w-[1240px] lg:justify-center">
        {screens.map(([v, t], i) => (
          <figure key={v} className="shrink-0 snap-center">
            <PhoneMockup variant={v} className="w-[250px] sm:w-[260px]" />
            <figcaption className="mt-4 text-center text-sm">
              <span className="font-serif text-pessego-700">{String(i + 1).padStart(2, "0")}</span> {t}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

export function Video() {
  const [play, setPlay] = useState(false);
  return (
    <section id="video" className="bg-salvia-900 py-20 text-marfim md:py-28">
      <div className="mx-auto grid max-w-5xl items-center gap-12 px-5 md:grid-cols-2">
        <div className="text-center md:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-pessego-300">Por trás do cuidado</p>
          <h2 className="mt-3 font-serif text-4xl md:text-5xl">Conheça a proposta do Leviã.</h2>
          <p className="mt-4 text-lg text-marfim/75">Menos de um minuto para entender como o Leviã pode deixar sua rotina mais leve.</p>
          <TrialButton className="mt-8 bg-pessego-500 text-salvia-900 hover:bg-pessego-300" />
        </div>
        <div className="mx-auto w-full max-w-[320px]">
          <div className="relative aspect-[9/16] overflow-hidden rounded-[1.75rem] bg-black shadow-2xl ring-1 ring-white/10">
            {play ? (
              <iframe
                className="absolute inset-0 h-full w-full"
                src={`https://www.youtube.com/embed/${YOUTUBE_ID}?autoplay=1&rel=0&playsinline=1`}
                title="Vídeo oficial do Leviã"
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : (
              <button onClick={() => setPlay(true)} className="group absolute inset-0 h-full w-full" aria-label="Reproduzir vídeo oficial do Leviã">
                <img
                  src={`https://i.ytimg.com/vi/${YOUTUBE_ID}/oar2.jpg`}
                  onError={(e) => ((e.currentTarget as HTMLImageElement).src = `https://i.ytimg.com/vi/${YOUTUBE_ID}/hqdefault.jpg`)}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover opacity-85 transition group-hover:opacity-100"
                />
                <span className="absolute inset-0 grid place-items-center">
                  <span className="grid h-16 w-16 place-items-center rounded-full bg-marfim/95 shadow-xl transition group-hover:scale-110">
                    <svg viewBox="0 0 24 24" className="ml-1 h-7 w-7 fill-salvia-900"><path d="M8 5v14l11-7z" /></svg>
                  </span>
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

const faqs: [string, React.ReactNode][] = [
  ["O Leviã substitui meu médico ou nutricionista?", "Não. O Leviã não substitui acompanhamento médico ou nutricional. Ele ajuda você a organizar refeições, hábitos e registros, e gera relatórios que podem enriquecer suas consultas. Medicação e ajustes de dose: sempre com seu médico."],
  ["Funciona para quem usa Ozempic, Mounjaro ou Wegovy?", "Sim. O módulo GLP-1 ajuda a registrar doses, rodízio de aplicação, efeitos, apetite e peso, com lembretes. É uma ferramenta de registro e referência, não de prescrição."],
  ["Quanto custa e como assino?", <>Você começa com <b>7 dias grátis</b>: fale com a gente no WhatsApp, receba seu serial e ative em {LINK_ATIVAR_LABEL}. A qualquer momento durante o teste, assine pelo checkout seguro da Hotmart: <b>Mensal R$ 19,97</b> (R$ 0,66/dia) ou <b>Anual R$ 191,71</b> (R$ 0,52/dia, 20% OFF). Após a confirmação do pagamento, você recebe no WhatsApp o serial do seu plano: 30 dias (mensal) ou 365 dias (anual). Se já estiver usando o teste, o acesso é atualizado sem precisar reativar.</>],
  ["O que acontece depois dos 7 dias?", "Se você ainda não assinou, o acesso fica pausado até você ativar um plano. Nenhum dado é apagado: ao assinar, você continua de onde parou, com seu diário e histórico."],
  ["Preciso baixar na App Store ou na Play Store?", "Não. O Leviã é um app web (PWA): funciona direto no navegador do celular ou computador, e você pode adicioná-lo à tela inicial. Cada serial vale para até 2 aparelhos."],
  ["Meus dados estão seguros?", "Dados de saúde são sensíveis (LGPD, art. 11) e só são tratados com seu consentimento explícito. Seus dados nunca são vendidos, e você pode pedir acesso, correção, exclusão ou portabilidade quando quiser."],
];

export function Faq() {
  return (
    <section id="faq" className="mx-auto grid max-w-6xl gap-10 px-5 py-20 md:grid-cols-[0.8fr_1.2fr] md:py-28">
      <div>
        <p className="eyebrow">Pode perguntar</p>
        <h2 className="mt-3 font-serif text-4xl text-salvia-900 md:text-5xl">Um pouco mais de clareza.</h2>
        <p className="mt-5 text-carvao/70">Ficou com alguma dúvida? A gente conversa.</p>
        <a
          href={whatsappWithText("Olá! Tenho uma dúvida sobre o Leviã.")}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex items-center gap-2 rounded-full border border-salvia-300 px-5 py-3 font-semibold text-salvia-900 hover:bg-salvia-50"
        >
          <WhatsIcon className="h-5 w-5 text-salvia-700" /> Falar pelo WhatsApp
        </a>
      </div>
      <div className="space-y-3">
        {faqs.map(([q, a], i) => (
          <details key={i} className="group rounded-2xl bg-white p-5 ring-1 ring-salvia-100 open:ring-salvia-300" open={i === 2}>
            <summary className="flex cursor-pointer items-center justify-between gap-4 font-semibold text-salvia-900">
              {q}
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-salvia-50 text-salvia-700 transition group-open:rotate-45">+</span>
            </summary>
            <div className="mt-3 leading-relaxed text-carvao/75">{a}</div>
          </details>
        ))}
      </div>
    </section>
  );
}

export function Privacidade() {
  const flow = [
    ["Você no Leviã", "No controle da sua jornada."],
    ["Coleta mínima", "Refeições, doses e glicemia ficam no seu aparelho; o servidor guarda só o necessário para o acesso."],
    ["Sem surpresas", "Sem anúncios e sem venda de dados. A foto só vai para a IA quando você pede."],
    ["Devolutiva", "Relatórios e evolução."],
  ];
  return (
    <section id="privacidade" className="bg-salvia-50 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <div className="max-w-2xl">
          <p className="eyebrow">Privacidade é cuidado</p>
          <h2 className="mt-3 font-serif text-4xl text-salvia-900 md:text-5xl">Seus dados. Seus direitos.</h2>
          <p className="mt-4 text-lg text-carvao/75">Dados de saúde são sensíveis (LGPD, art. 11). O uso exige consentimento explícito.</p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {flow.map(([t, d], i) => (
            <div key={t} className="rounded-2xl bg-white p-6">
              <span className="font-serif text-xl text-pessego-500">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="mt-2 font-semibold text-salvia-900">{t}</h3>
              <p className="mt-1 text-sm text-carvao/70">{d}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 flex flex-col gap-4 rounded-2xl bg-salvia-900 p-6 text-marfim md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-serif text-2xl">🔒 Seus dados nunca são vendidos.</p>
            <p className="mt-1 text-sm text-marfim/70">Acesso · Correção · Exclusão · Portabilidade · Revogação</p>
          </div>
          <a href={LINK_PRIVACIDADE} target="_blank" rel="noopener noreferrer" className="shrink-0 rounded-full bg-marfim px-5 py-3 text-center font-semibold text-salvia-900 hover:bg-salvia-50">
            Ler a política de privacidade
          </a>
        </div>
        <p className="mt-4 text-xs text-carvao/60">Esta página institucional não coleta dados de saúde. Com o seu consentimento, usamos o pixel da Meta para medir visitas e cliques no checkout — você pode recusar sem perder nenhuma funcionalidade.</p>
      </div>
    </section>
  );
}

export function CtaFinal() {
  return (
    <section className="relative overflow-hidden py-24 text-center md:py-32">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[480px] w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-pessego-100 blur-3xl" />
      <div className="relative mx-auto max-w-2xl px-5">
        <p className="eyebrow">Sem culpa. Sem pressa. No seu ritmo.</p>
        <h2 className="mt-4 font-serif text-5xl text-salvia-900 md:text-6xl">Comece mais leve hoje.</h2>
        <p className="mt-5 text-lg text-carvao/75">7 dias grátis para conhecer. Pequenos passos, um cuidado de cada vez.</p>
        <TrialButton className="mt-8" />
        <p className="mt-4 text-sm text-carvao/60">
          Já recebeu seu serial?{" "}
          <a href={LINK_ATIVAR} className="font-semibold text-salvia-700 underline underline-offset-4">Ative em {LINK_ATIVAR_LABEL}</a>
        </p>
      </div>
    </section>
  );
}

export function Contato() {
  const [nome, setNome] = useState("");
  const [assunto, setAssunto] = useState("Quero começar o teste grátis");
  const [msg, setMsg] = useState("");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = `Olá! Meu nome é ${nome.trim() || "—"}.\nAssunto: ${assunto}${msg.trim() ? `\n${msg.trim()}` : ""}`;
    window.open(whatsappWithText(text), "_blank", "noopener");
  };
  const input = "mt-1.5 w-full rounded-xl border border-salvia-200 bg-white px-4 py-3 text-base outline-none focus:border-salvia-500 focus:ring-2 focus:ring-salvia-100";
  return (
    <section id="contato" className="px-5 pb-20">
      <div className="mx-auto grid max-w-5xl gap-10 rounded-[2rem] bg-white p-7 ring-1 ring-salvia-100 md:grid-cols-2 md:p-12">
        <div>
          <p className="eyebrow">Vamos conversar?</p>
          <h2 className="mt-3 font-serif text-4xl text-salvia-900">Seu próximo passo, com a gente.</h2>
          <p className="mt-4 text-carvao/75">Deixe sua mensagem pronta para o WhatsApp. Nada é enviado ou guardado por este site.</p>
          <p className="mt-4 rounded-xl bg-pessego-100 p-4 text-sm">⚠️ Não informe dados de saúde neste formulário.</p>
          <p className="mt-4 text-sm text-carvao/60">
            Prefere e-mail? <a href={`mailto:${EMAIL_CONTATO}`} className="font-semibold text-salvia-700 underline">{EMAIL_CONTATO}</a>
          </p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <label className="block text-sm font-medium">
            Como podemos te chamar?
            <input className={input} value={nome} onChange={(e) => setNome(e.target.value)} maxLength={60} autoComplete="given-name" placeholder="Seu primeiro nome" />
          </label>
          <label className="block text-sm font-medium">
            Assunto
            <select className={input} value={assunto} onChange={(e) => setAssunto(e.target.value)}>
              <option>Quero começar o teste grátis</option>
              <option>Dúvida sobre planos e pagamento</option>
              <option>Ajuda para ativar meu serial</option>
              <option>Outro assunto</option>
            </select>
          </label>
          <label className="block text-sm font-medium">
            Sua pergunta (opcional)
            <textarea className={input} rows={3} value={msg} onChange={(e) => setMsg(e.target.value)} maxLength={400} placeholder="Escreva sem dados de saúde" />
          </label>
          <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-salvia-700 px-6 py-3.5 font-semibold text-marfim hover:bg-salvia-900">
            <WhatsIcon className="h-5 w-5" /> Continuar no WhatsApp
          </button>
        </form>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="bg-salvia-900 text-marfim">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo light />
          <p className="mt-4 max-w-sm text-sm text-marfim/70">Emagrecimento com cuidado, não com culpa. Mais leve a cada dia.</p>
        </div>
        <nav aria-label="Rodapé" className="space-y-2 text-sm">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-pessego-300">Leviã</p>
          <a href="#como-funciona" className="block text-marfim/80 hover:text-marfim">Como funciona</a>
          <a href="#planos" className="block text-marfim/80 hover:text-marfim">Planos</a>
          <a href="#faq" className="block text-marfim/80 hover:text-marfim">Dúvidas frequentes</a>
          <a href={LINK_ATIVAR} className="block text-marfim/80 hover:text-marfim">Ativar serial</a>
        </nav>
        <div className="space-y-2 text-sm">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-pessego-300">Cuidado</p>
          <a href={LINK_TERMOS} target="_blank" rel="noopener noreferrer" className="block text-marfim/80 hover:text-marfim">Termos de Serviço</a>
          {pixelConfigurado() && (
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event("levia:pixel-prefs"))}
              className="block text-left text-marfim/80 hover:text-marfim"
            >
              Preferências de cookies
            </button>
          )}
          <a href={LINK_PRIVACIDADE} target="_blank" rel="noopener noreferrer" className="block text-marfim/80 hover:text-marfim">Política de privacidade</a>
          <a href={`mailto:${EMAIL_CONTATO}`} className="block text-marfim/80 hover:text-marfim">{EMAIL_CONTATO}</a>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-6xl space-y-2 px-5 py-6 text-xs text-marfim/60">
          <p>O Leviã não substitui acompanhamento médico ou nutricional. Medicação e ajustes de dose: sempre com seu médico. Resultados individuais variam. As estimativas de nutrientes por IA são aproximadas.</p>
          <p>© {new Date().getFullYear()} Leviã · leviapp.org</p>
        </div>
      </div>
    </footer>
  );
}
