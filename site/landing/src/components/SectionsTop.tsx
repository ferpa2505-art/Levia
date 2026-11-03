import { useState } from "react";
import { cn } from "../utils/cn";
import { Logo, WhatsIcon, Check } from "./Brand";
import { PhoneMockup } from "./PhoneMockup";
import { WHATSAPP_TRIAL, LINK_ATIVAR, LINK_ATIVAR_LABEL } from "../config";

const IMG = "/images/prato-brasileiro.jpg";

export function TrialButton({ children = "Começar teste grátis de 7 dias", className = "" }: { children?: React.ReactNode; className?: string }) {
  return (
    <a
      href={WHATSAPP_TRIAL}
      target="_blank"
      rel="noopener noreferrer"
      className={cn("inline-flex items-center justify-center gap-2 rounded-full bg-salvia-700 px-6 py-3.5 text-[15px] font-semibold text-marfim shadow-lg shadow-salvia-700/20 transition hover:bg-salvia-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-salvia-700", className)}
    >
      <WhatsIcon className="h-5 w-5" />
      {children}
    </a>
  );
}

const nav = [
  ["Como funciona", "#como-funciona"],
  ["GLP-1", "#glp1"],
  ["Diabetes", "#diabetes"],
  ["Planos", "#planos"],
  ["Dúvidas", "#faq"],
];

export function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-salvia-100/70 bg-marfim/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <a href="#inicio" aria-label="Leviã — início">
          <Logo />
        </a>
        <nav className="hidden items-center gap-7 text-sm text-carvao/80 md:flex" aria-label="Principal">
          {nav.map(([l, h]) => (
            <a key={h} href={h} className="hover:text-salvia-700">
              {l}
            </a>
          ))}
        </nav>
        <div className="hidden md:block">
          <a href={WHATSAPP_TRIAL} target="_blank" rel="noopener noreferrer" className="rounded-full bg-salvia-700 px-4 py-2 text-sm font-semibold text-marfim hover:bg-salvia-900">
            Teste grátis
          </a>
        </div>
        <button
          className="grid h-10 w-10 place-items-center rounded-full text-salvia-900 md:hidden"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-label="Abrir menu"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>
      {open && (
        <nav className="border-t border-salvia-100 bg-marfim px-5 pb-5 md:hidden" aria-label="Menu móvel">
          {nav.map(([l, h]) => (
            <a key={h} href={h} onClick={() => setOpen(false)} className="block border-b border-salvia-50 py-3 text-carvao">
              {l}
            </a>
          ))}
          <TrialButton className="mt-4 w-full" />
        </nav>
      )}
    </header>
  );
}

export function Hero() {
  return (
    <section id="inicio" className="relative overflow-hidden">
      <div className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-salvia-100/60 blur-3xl" />
      <div className="pointer-events-none absolute -left-32 bottom-0 h-80 w-80 rounded-full bg-pessego-100 blur-3xl" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 pb-16 pt-10 md:grid-cols-[1.1fr_0.9fr] md:pb-24 md:pt-16">
        <div>
          <p className="eyebrow">Emagrecimento com cuidado, não com culpa</p>
          <h1 className="mt-4 font-serif text-[2.75rem] leading-[1.05] text-salvia-900 sm:text-6xl md:text-7xl">
            Mais leve
            <br />
            <em className="font-normal text-salvia-500">a cada dia.</em>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-carvao/80">
            O Leviã entende GLP-1, diabetes e comida brasileira de verdade. Fotografe o prato e conheça uma estimativa de calorias, proteína, carboidratos, gorduras e fibras.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <TrialButton />
            <a href="#como-funciona" className="inline-flex items-center justify-center gap-2 rounded-full border border-salvia-300 px-6 py-3.5 text-[15px] font-semibold text-salvia-900 transition hover:bg-salvia-50">
              Ver como funciona <span aria-hidden>↓</span>
            </a>
          </div>
          <p className="mt-4 text-sm text-carvao/70">
            7 dias grátis · 2 análises de prato por IA · sem cartão para testar
          </p>
          <div className="mt-6 flex flex-wrap gap-2 text-xs font-medium text-salvia-900">
            {["Sem culpa", "Sem dieta restritiva", "Comida brasileira"].map((t) => (
              <span key={t} className="rounded-full bg-salvia-50 px-3 py-1.5 ring-1 ring-salvia-100">
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="relative">
          <img
            src={IMG}
            alt="Comida brasileira de verdade: arroz, feijão, frango grelhado, farofa, vinagrete e açaí"
            className="absolute -left-6 top-10 hidden h-72 w-72 rounded-[2.5rem] object-cover opacity-90 shadow-xl md:block"
            fetchPriority="high"
          />
          <PhoneMockup className="relative md:ml-auto md:mr-4" />
          <p className="mt-4 text-center text-[11px] uppercase tracking-[0.2em] text-carvao/50">Prévia ilustrativa do app</p>
        </div>
      </div>
    </section>
  );
}

export function TrialExplainer() {
  const items = [
    { k: "7 dias", t: "grátis para conhecer", d: "Use o Leviã com calma, no seu ritmo, antes de decidir." },
    { k: "2 análises", t: "de prato por IA", d: "Fotografe duas refeições e veja a estimativa de nutrientes." },
    { k: "Na ativação", t: "começa a contagem", d: "Os 7 dias contam a partir da ativação do serial e não reiniciam." },
  ];
  return (
    <section aria-labelledby="teste-titulo" className="px-5">
      <div className="mx-auto max-w-6xl rounded-[2rem] bg-salvia-900 px-6 py-10 text-marfim md:px-12">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-pessego-300">Teste grátis</p>
            <h2 id="teste-titulo" className="mt-2 font-serif text-3xl md:text-4xl">
              Experimente antes de assinar.
            </h2>
          </div>
          <p className="max-w-md text-sm text-marfim/75">
            Você recebe um serial pelo WhatsApp, ativa em <b className="text-marfim">{LINK_ATIVAR_LABEL}</b> e começa. Sem cartão de crédito para testar.
          </p>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {items.map((i) => (
            <div key={i.k} className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
              <p className="font-serif text-3xl text-pessego-300">{i.k}</p>
              <p className="mt-1 font-semibold">{i.t}</p>
              <p className="mt-2 text-sm text-marfim/70">{i.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Momento() {
  const cards = [
    { e: "💉", t: "Uso GLP-1", d: "Ozempic, Mounjaro ou Wegovy. Volume menor, proteína em foco e apoio para comer bem.", h: "#glp1", bg: "bg-salvia-50" },
    { e: "🩸", t: "Tenho diabetes", d: "Tipo 1 ou 2. Carboidratos e glicemia lado a lado, com relatórios para a consulta.", h: "#diabetes", bg: "bg-pessego-100" },
    { e: "🌿", t: "Quero uma rotina mais leve", d: "Sem dieta restritiva. Comida brasileira, hábitos possíveis e constância.", h: "#recursos", bg: "bg-lavanda-100" },
  ];
  return (
    <section id="momento" className="mx-auto max-w-6xl px-5 py-20 md:py-28">
      <div className="text-center">
        <p className="eyebrow">Cada jornada é única</p>
        <h2 className="mt-3 font-serif text-4xl text-salvia-900 md:text-5xl">Qual é o seu momento?</h2>
      </div>
      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {cards.map((c) => (
          <a key={c.t} href={c.h} className={`group rounded-[1.75rem] ${c.bg} p-7 transition hover:-translate-y-1 hover:shadow-lg`}>
            <span className="text-3xl" aria-hidden>{c.e}</span>
            <h3 className="mt-4 font-serif text-2xl text-salvia-900">{c.t}</h3>
            <p className="mt-2 text-carvao/75">{c.d}</p>
            <span className="mt-5 inline-block text-sm font-semibold text-salvia-700 group-hover:underline">Saiba mais →</span>
          </a>
        ))}
      </div>
    </section>
  );
}

export function Recursos() {
  const feats = [
    ["📸", "Fotografe o prato", "Uma foto, uma estimativa dos nutrientes. Menos contas, mais vida."],
    ["💚", "Módulo GLP-1", "Proteína, doses e efeitos. Um cuidado que acompanha seu momento."],
    ["📈", "Módulo Diabetes", "Carboidratos e glicemia lado a lado, na sua rotina."],
    ["🥗", "Macros diários completos", "Proteína, carboidratos, gorduras e fibras, sem complicar."],
    ["🗓️", "Relatórios que fazem sentido", "Seu progresso semanal e mensal, pronto para compartilhar."],
    ["🌱", "Hábitos e constância", "Pequenas escolhas que cabem na vida real. Sem perfeição."],
    ["🔒", "Privacidade em primeiro lugar", "Seus dados de saúde merecem cuidado e respeito."],
  ];
  return (
    <section id="recursos" className="bg-white/60 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <div className="max-w-2xl">
          <p className="eyebrow">Feito para a vida real</p>
          <h2 className="mt-3 font-serif text-4xl text-salvia-900 md:text-5xl">Menos complicação. Mais você.</h2>
          <p className="mt-4 text-lg text-carvao/75">Tecnologia para cuidar da alimentação, sem deixar de viver.</p>
        </div>
        <div className="mt-12 grid items-center gap-10 md:grid-cols-2">
          <div className="relative overflow-hidden rounded-[2rem]">
            <img src={IMG} alt="Prato de arroz, feijão, farofa e frango, com açaí e suco de caju" className="aspect-[4/3] w-full object-cover" loading="lazy" />
            <div className="absolute bottom-4 left-4 right-4 rounded-2xl bg-marfim/95 p-4 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-widest text-salvia-700">Exemplo de análise</p>
              <p className="mt-1 text-sm">Arroz, feijão, frango grelhado, farofa · <b>≈ 586 kcal</b> · 38 g proteína</p>
            </div>
          </div>
          <div>
            <h3 className="font-serif text-3xl text-salvia-900 md:text-4xl">
              IA que reconhece
              <br />
              <em className="text-salvia-500">comida brasileira.</em>
            </h3>
            <p className="mt-4 text-lg text-carvao/75">
              Açaí, pão de queijo, arroz, feijão, farofa, vinagrete. O Leviã reconhece de verdade, não só salada e frango. Você confere e ajusta as porções.
            </p>
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-pessego-700">Do nosso prato para a sua rotina</p>
          </div>
        </div>
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {feats.map(([e, t, d]) => (
            <div key={t} className="rounded-2xl bg-marfim p-6 ring-1 ring-salvia-100">
              <span className="text-2xl" aria-hidden>{e}</span>
              <h4 className="mt-3 font-semibold text-salvia-900">{t}</h4>
              <p className="mt-1.5 text-sm text-carvao/70">{d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ComoFunciona() {
  const steps = [
    ["Fale com a gente no WhatsApp", "Toque em “Começar teste grátis”. O LEVI, nosso assistente, conversa com você e pede nome, e-mail e objetivo, sempre com seu consentimento."],
    ["Receba seu serial", "Você recebe no WhatsApp um código no formato XXXX-XXXX-XXXX-XXXX e o link de ativação. Ele vale para até 2 aparelhos."],
    ["Ative em " + LINK_ATIVAR_LABEL, "Abra o link, toque em “Ativar” e cole o serial. Sem baixar nada na App Store ou Play Store: o Leviã funciona no navegador."],
    ["Teste por 7 dias", "Conte sua história, defina sua meta diária e faça 2 análises de prato por IA. A contagem começa na ativação."],
    ["Assine pelo link seguro", "Quando quiser, pague no checkout seguro da Hotmart. Após a confirmação, você recebe no WhatsApp o serial do seu plano."],
  ];
  return (
    <section id="como-funciona" className="mx-auto max-w-6xl px-5 py-20 md:py-28">
      <div className="text-center">
        <p className="eyebrow">Seu primeiro passo é simples</p>
        <h2 className="mt-3 font-serif text-4xl text-salvia-900 md:text-5xl">Do seu prato ao seu progresso.</h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-carvao/75">Sem baixar nas lojas. Você começa pelo WhatsApp, com a gente por perto.</p>
      </div>
      <ol className="relative mt-14 grid gap-5 md:grid-cols-5">
        {steps.map(([t, d], i) => (
          <li key={t} className="relative rounded-[1.5rem] bg-white p-6 shadow-sm ring-1 ring-salvia-100">
            <span className="font-serif text-4xl text-pessego-500">{String(i + 1).padStart(2, "0")}</span>
            <h3 className="mt-3 font-semibold leading-snug text-salvia-900">{t}</h3>
            <p className="mt-2 text-sm text-carvao/70">{d}</p>
          </li>
        ))}
      </ol>
      <div className="mt-10 flex flex-col items-center gap-4">
        <TrialButton />
        <p className="text-sm text-carvao/60">
          Já tem um serial?{" "}
          <a href={LINK_ATIVAR} className="font-semibold text-salvia-700 underline underline-offset-4">
            Ativar agora
          </a>
        </p>
      </div>
      <details className="mx-auto mt-10 max-w-3xl rounded-2xl bg-salvia-50 p-5 text-sm">
        <summary className="flex cursor-pointer items-center gap-2 font-semibold text-salvia-900">
          <Check className="h-5 w-5 text-salvia-700" /> Como funciona a meta diária?
        </summary>
        <p className="mt-3 text-carvao/75">
          O Leviã não calcula metas por você. A meta diária de calorias é sua: você a define no app, de preferência com seu médico ou nutricionista, e acompanha o anel do dia. Nada aqui substitui avaliação individual.</p>
      </details>
    </section>
  );
}
