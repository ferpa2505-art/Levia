import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { traduzirAtual as t, obterIdiomaAtual } from '@/i18n';
import { carregarPerfil } from '@utils/profileStorage';
import { carregarRegistros } from '@utils/recordsStorage';
import { carregarDiabetes } from '@utils/diabetesStorage';
import { carregarGlp1 } from '@utils/glp1Storage';
import { valorMgDl, momentoGlicemia, media } from '@utils/glicemia';
import { rotuloUnidade, Medicacao, MedicacoesData } from '@models/medicacoes';
import { suspenderBloqueio } from '@utils/bloqueioSuspenso';

/**
 * Relatório em PDF para levar à consulta: peso, glicemia, medicações,
 * GLP-1 e alimentação do período. Gerado no aparelho e compartilhado pela
 * folha de compartilhamento do Android (WhatsApp, e-mail, Drive...).
 */

const esc = (s: unknown) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

function dataBR(iso: string) {
  const [a, m, d] = iso.split('-');
  return d && m && a ? `${d}/${m}/${a}` : iso;
}

function inicioDoPeriodo(dias: number) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - (dias - 1));
  return d;
}

function isoLocal(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function posologia(m: Medicacao) {
  if (m.uso === 'esporadico') return t('med.esporadico');
  if (m.uso === 'tratamento') {
    const ini = m.inicio ? m.inicio.replace('T', ' ') : '';
    return t('rel.posTratamento', { d: m.dias ?? 0, x: m.vezesPorDia ?? 0, ini: ini ? dataBR(ini.slice(0, 10)) + ini.slice(10) : '' });
  }
  if (m.frequencia === 'semanal') return t('rel.posSemanal', { h: m.primeiraDose ?? '' });
  return (m.intervaloHoras ?? 24) === 24
    ? t('rel.posDiaria', { h: m.primeiraDose ?? '' })
    : t('rel.posHoras', { n: m.intervaloHoras ?? 0, h: m.primeiraDose ?? '' });
}

function tabela(cabecalho: string[], linhas: (string | number)[][], vazio: string) {
  if (linhas.length === 0) return `<p class="vazio">${esc(vazio)}</p>`;
  return `<table><thead><tr>${cabecalho.map((c) => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${linhas
    .map((l) => `<tr>${l.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`)
    .join('')}</tbody></table>`;
}

function resumo(itens: [string, string | number][]) {
  return `<div class="resumo">${itens
    .map(([r, v]) => `<div class="item"><div class="v">${esc(v)}</div><div class="r">${esc(r)}</div></div>`)
    .join('')}</div>`;
}

export async function montarHtmlRelatorio(dias: number): Promise<string> {
  const [perfil, registros, diabetes, glp1, medsRaw] = await Promise.all([
    carregarPerfil(),
    carregarRegistros(),
    carregarDiabetes(),
    carregarGlp1(),
    AsyncStorage.getItem('levia:medicacoes'),
  ]);
  const meds: Medicacao[] = medsRaw ? ((JSON.parse(medsRaw) as MedicacoesData).medicacoes ?? []) : [];
  const idioma = obterIdiomaAtual();
  const inicio = inicioDoPeriodo(dias);
  const iniIso = isoLocal(inicio);
  const hojeIso = isoLocal(new Date());
  const noPeriodo = (data: string) => data >= iniIso && data <= hojeIso;

  // --- Peso ---
  const pesos = registros.pesos.filter((p) => noPeriodo(p.data)).sort((a, b) => a.data.localeCompare(b.data));
  const pesoAtual = [...registros.pesos].sort((a, b) => b.data.localeCompare(a.data))[0]?.pesoKg ?? perfil.pesoAtualKg;
  const variacao = pesos.length >= 2 ? Math.round((pesos[pesos.length - 1].pesoKg - pesos[0].pesoKg) * 10) / 10 : null;

  // --- Glicemia ---
  const glic = diabetes.glicemias
    .filter((g) => momentoGlicemia(g) >= inicio)
    .sort((a, b) => momentoGlicemia(a).getTime() - momentoGlicemia(b).getTime());
  const valores = glic.map(valorMgDl);
  const { alvoMinMgDl: min, alvoMaxMgDl: max } = diabetes.config;
  const noAlvo = valores.length ? Math.round((valores.filter((v) => v >= min && v <= max).length / valores.length) * 100) : null;

  // --- GLP-1 ---
  const doses = glp1.doses.filter((d) => noPeriodo(d.data)).sort((a, b) => (a.data + a.horario).localeCompare(b.data + b.horario));
  const sintomas = glp1.sintomas.filter((s) => noPeriodo(s.data)).sort((a, b) => (a.data + a.horario).localeCompare(b.data + b.horario));

  // --- Alimentação (média dos dias com registro) ---
  const refeicoes = registros.refeicoes.filter((r) => noPeriodo(r.data));
  const diasComRefeicao = new Set(refeicoes.map((r) => r.data)).size;
  const mediaDia = (f: (r: (typeof refeicoes)[number]) => number) =>
    diasComRefeicao ? Math.round(refeicoes.reduce((s, r) => s + f(r), 0) / diasComRefeicao) : 0;

  const nome = perfil.nome || perfil.comoChamar || '';
  const geradoEm = new Date().toLocaleString(idioma, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return `<!doctype html><html lang="${esc(idioma)}"><head><meta charset="utf-8">
<style>
  @page { margin: 18mm 14mm; }
  body { font-family: -apple-system, Roboto, 'Segoe UI', sans-serif; color: #24302B; font-size: 11pt; }
  h1 { font-family: Georgia, serif; font-weight: 400; color: #4E8A72; margin: 0; font-size: 22pt; }
  h2 { font-size: 13pt; color: #4E8A72; border-bottom: 1px solid #DCE6E0; padding-bottom: 4px; margin-top: 22px; }
  .sub { color: #6B746F; margin: 2px 0 0; }
  .dados { margin-top: 10px; color: #3A4641; }
  .resumo { display: flex; gap: 8px; flex-wrap: wrap; margin: 8px 0; }
  .item { border: 1px solid #DCE6E0; border-radius: 8px; padding: 6px 10px; min-width: 90px; }
  .v { font-size: 14pt; font-weight: 600; } .r { font-size: 8.5pt; color: #6B746F; }
  table { width: 100%; border-collapse: collapse; margin-top: 6px; font-size: 9.5pt; }
  th { text-align: left; background: #EEF4F1; padding: 5px; } td { padding: 4px 5px; border-bottom: 1px solid #EDF0EE; }
  .vazio { color: #8B938F; font-style: italic; }
  .aviso { margin-top: 26px; font-size: 8.5pt; color: #6B746F; border-top: 1px solid #DCE6E0; padding-top: 8px; }
</style></head><body>
<h1>${esc(t('rel.titulo'))}</h1>
<p class="sub">${esc(t('rel.periodo', { ini: dataBR(iniIso), fim: dataBR(hojeIso), n: dias }))} · ${esc(t('rel.geradoEm', { d: geradoEm }))}</p>
<p class="dados">${[
    nome && `<b>${esc(nome)}</b>`,
    perfil.idade != null && esc(t('perfil.anos', { n: perfil.idade })),
    perfil.alturaCm != null && `${esc(perfil.alturaCm)} cm`,
    perfil.tipoDiabetes && perfil.tipoDiabetes !== 'nenhum' && esc(t(`onb.tipodiabetes.${perfil.tipoDiabetes}_nome` as never)),
  ]
    .filter(Boolean)
    .join(' · ')}</p>

<h2>${esc(t('rel.peso'))}</h2>
${resumo([
    [t('p.atual'), pesoAtual != null ? `${pesoAtual} kg` : '–'],
    [t('rel.variacaoPeriodo'), variacao != null ? `${variacao > 0 ? '+' : ''}${variacao} kg` : '–'],
    [t('perfil.minhaMeta'), perfil.metaPesoKg != null ? `${perfil.metaPesoKg} kg` : '–'],
  ])}
${tabela([t('rel.data'), 'kg'], pesos.map((p) => [dataBR(p.data), p.pesoKg]), t('rel.semRegistros'))}

<h2>${esc(t('gl.titulo'))}</h2>
${resumo([
    [t('rel.medicoes'), valores.length],
    [t('rel.mediaMgDl'), valores.length ? media(valores) : '–'],
    [t('rel.minMax'), valores.length ? `${Math.min(...valores)} / ${Math.max(...valores)}` : '–'],
    [t('rel.naFaixa', { min, max }), noAlvo != null ? `${noAlvo}%` : '–'],
    [t('rel.abaixo70'), valores.filter((v) => v < 70).length],
  ])}
${tabela(
    [t('rel.data'), t('rel.hora'), 'mg/dL', t('med.obs')],
    glic.slice(-150).map((g) => [dataBR(g.data), g.horario, valorMgDl(g), g.notas ?? '']),
    t('rel.semRegistros')
  )}

<h2>${esc(t('med.titulo'))}</h2>
${tabela(
    [t('med.nome'), t('med.dose'), t('med.frequencia')],
    meds.map((m) => [m.principio ? `${m.nome} (${m.principio})` : m.nome, m.dose ? `${m.dose} ${rotuloUnidade(m.unidade, idioma)}` : '–', posologia(m)]),
    t('rel.semRegistros')
  )}

<h2>${esc(t('titulos.glp1'))}</h2>
${tabela(
    [t('rel.data'), t('rel.hora'), t('rel.medicamento'), 'mg', t('rel.local')],
    doses.map((d) => [dataBR(d.data), d.horario, d.medicamento, d.dosagemMg, d.local]),
    t('rel.semRegistros')
  )}
${sintomas.length ? tabela([t('rel.data'), t('rel.sintoma'), t('rel.intensidade')], sintomas.map((s) => [dataBR(s.data), s.sintoma, s.intensidade]), '') : ''}

<h2>${esc(t('abas.diario'))}</h2>
${resumo([
    [t('rel.diasRegistro'), diasComRefeicao],
    [t('rel.kcalDia'), diasComRefeicao ? mediaDia((r) => r.kcal) : '–'],
    [t('rel.protDia'), diasComRefeicao ? mediaDia((r) => r.proteinaG) : '–'],
    [t('rel.carbDia'), diasComRefeicao ? mediaDia((r) => r.carboidratoG ?? 0) : '–'],
  ])}

<p class="aviso">${esc(t('rel.aviso'))}</p>
</body></html>`;
}

/** Gera o PDF e abre o compartilhamento. Devolve false se não deu para compartilhar. */
export async function compartilharRelatorio(dias: number): Promise<boolean> {
  const html = await montarHtmlRelatorio(dias);
  const { uri } = await Print.printToFileAsync({ html });
  if (!(await Sharing.isAvailableAsync())) return false;
  suspenderBloqueio();
  await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: t('rel.titulo') });
  return true;
}
