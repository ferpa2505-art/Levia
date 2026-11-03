import { cn } from "../utils/cn";

const IMG = "/images/prato-brasileiro.jpg";

function todayLabel() {
  const d = new Date();
  const wd = d.toLocaleDateString("pt-BR", { weekday: "long" });
  const day = String(d.getDate()).padStart(2, "0");
  const mon = d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
  return `${wd} · ${day} ${mon}`.toUpperCase();
}

export type Variant = "hoje" | "diario" | "prato" | "semana";

const titles: Record<Variant, string> = {
  hoje: "Bom dia ☀",
  diario: "Seu diário",
  prato: "Seu prato, sem mistério",
  semana: "Uma semana mais leve",
};

const nutrients = [
  { n: "Proteína", v: 92, p: 28, c: "bg-salvia-500" },
  { n: "Carboidratos", v: 148, p: 45, c: "bg-pessego-500" },
  { n: "Gorduras", v: 38, p: 26, c: "bg-pessego-300" },
  { n: "Fibras", v: 19, c: "bg-salvia-300" },
];

export function PhoneMockup({ variant = "hoje", className }: { variant?: Variant; className?: string }) {
  return (
    <div
      className={cn(
        "relative mx-auto w-[260px] rounded-[2.4rem] border-[7px] border-carvao bg-marfim shadow-2xl shadow-salvia-900/25 sm:w-[280px]",
        className,
      )}
      role="img"
      aria-label="Prévia ilustrativa da tela do aplicativo Leviã"
    >
      <div className="absolute left-1/2 top-1.5 h-5 w-24 -translate-x-1/2 rounded-full bg-carvao" />
      <div className="overflow-hidden rounded-[1.9rem] px-4 pb-3 pt-8 text-carvao">
        <div className="flex items-center justify-between text-[10px] font-semibold">
          <span className="font-serif tracking-[0.15em] text-salvia-900">
            LEVIÃ<span className="text-pessego-500">.</span>
          </span>
          <span className="text-carvao/50">{todayLabel()}</span>
        </div>
        <p className="mt-3 font-serif text-lg leading-tight">{titles[variant]}</p>

        {variant === "semana" ? (
          <div className="mt-3 space-y-3">
            <div className="rounded-2xl bg-lavanda-100 p-3">
              <p className="text-[9px] font-semibold tracking-widest text-carvao/60">CONSTÂNCIA, NÃO PERFEIÇÃO</p>
              <p className="mt-1 font-serif text-2xl">5 de 7 dias</p>
              <p className="text-[11px] text-carvao/70">Você cuidou de si nesta semana.</p>
            </div>
            <div className="flex justify-between">
              {["S", "T", "Q", "Q", "S", "S", "D"].map((d, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div
                    className={cn(
                      "w-6 rounded-full",
                      i < 5 ? "bg-salvia-500" : "bg-salvia-100",
                    )}
                    style={{ height: `${[44, 60, 38, 70, 52, 20, 20][i]}px` }}
                  />
                  <span className="text-[9px] text-carvao/60">{d}</span>
                </div>
              ))}
            </div>
            
            <div className="rounded-2xl bg-pessego-100 p-3 text-[11px]">
              Relatório semanal pronto para levar à consulta.
            </div>
          </div>
        ) : (
          <>
            {variant === "prato" ? (
              <div className="relative mt-3 overflow-hidden rounded-2xl">
                <img src={IMG} alt="" className="h-36 w-full object-cover" loading="lazy" />
                <span className="absolute bottom-2 left-2 rounded-full bg-marfim/90 px-2 py-0.5 text-[10px] font-medium">
                  ✓ Prato identificado · 586 kcal
                </span>
              </div>
            ) : (
              <div className="mt-3 flex items-center gap-3 rounded-2xl bg-salvia-50 p-3">
                <div className="relative h-14 w-14 shrink-0">
                  <svg viewBox="0 0 36 36" className="h-14 w-14 -rotate-90">
                    <circle cx="18" cy="18" r="15" fill="none" stroke="#DFEAE5" strokeWidth="4" />
                    <circle cx="18" cy="18" r="15" fill="none" stroke="#6FA58E" strokeWidth="4" strokeDasharray="71 94" strokeLinecap="round" />
                  </svg>
                </div>
                <div>
                  <p className="text-[9px] font-semibold tracking-widest text-carvao/60">SEU DIA ATÉ AQUI</p>
                  <p className="font-serif text-xl">
                    1.248 <span className="text-xs font-sans text-carvao/60">de 1.650 kcal</span>
                  </p>
                  <p className="text-[10px] text-salvia-700">Cada escolha conta.</p>
                </div>
              </div>
            )}

            <div className="mt-3 space-y-1.5">
              {nutrients.map((x) => (
                <div key={x.n}>
                  <div className="flex justify-between text-[10px]">
                    <span>{x.n}</span>
                    <span className="text-carvao/60">
                      <b className="text-carvao">{x.v}g</b>{x.p ? ` · ${x.p}% das kcal` : ""}
                    </span>
                  </div>
                  <div className="mt-0.5 h-1.5 rounded-full bg-salvia-50">
                    {x.p ? <div className={cn("h-1.5 rounded-full", x.c)} style={{ width: `${x.p}%` }} /> : null}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2 rounded-xl bg-white p-2 shadow-sm">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-pessego-100 text-sm">☕</span>
                <div className="flex-1 text-[10px] leading-tight">
                  <b>Café da manhã</b>
                  <br />
                  <span className="text-carvao/60">Pão de queijo, café e mamão</span>
                </div>
                <span className="text-[10px] font-semibold">312 kcal</span>
              </div>
              {variant !== "prato" && (
                <div className="flex items-center gap-2 rounded-xl bg-white p-2 shadow-sm">
                  <img src={IMG} alt="" className="h-8 w-8 rounded-lg object-cover" loading="lazy" />
                  <div className="flex-1 text-[10px] leading-tight">
                    <b>Almoço</b>
                    <br />
                    <span className="text-carvao/60">Arroz, feijão e frango</span>
                  </div>
                  <span className="text-[10px] font-semibold">586 kcal</span>
                </div>
              )}
            </div>
          </>
        )}

        <div className="mt-3 flex justify-around border-t border-salvia-100 pt-2 text-[9px] text-carvao/50">
          {["Hoje", "Diário", "Progresso", "Perfil"].map((t, i) => (
            <span key={t} className={i === 0 ? "font-semibold text-salvia-700" : ""}>
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
