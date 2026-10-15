// Teste dos cálculos de posologia: npx tsx --tsconfig tsconfig.json scripts/teste-posologia.ts
import { horariosDoDia, dosesDoTratamento, proximaDose, lerData } from '../src/utils/posologia';
import type { Medicacao } from '../src/types/medicacoes';

const fmt = (d: Date) => d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
console.log('a cada 8h desde 07:30:', horariosDoDia('07:30', 8).join(', '));
console.log('a cada 12h desde 21:00:', horariosDoDia('21:00', 12).join(', '));
console.log('1x/dia 08:00:', horariosDoDia('08:00', 24).join(', '));

const ini = lerData('02/10/2026')!; ini.setHours(10, 0);
console.log('Azitromicina 3 dias 1x/dia desde 02/10 10:00:', dosesDoTratamento(ini, 3, 1).map(fmt).join(' | '));
console.log('Amoxicilina 7 dias 3x/dia: total', dosesDoTratamento(ini, 7, 3).length, '| ultima', fmt(dosesDoTratamento(ini, 7, 3)[20]));

const base = { id: 'x', nome: 'Teste', dose: '1', unidade: 'comprimido', lembretes: true, calendario: false, notificationIds: [], calendarEventIds: [], criadaEm: '' } as unknown as Medicacao;
const agora = new Date(2026, 9, 2, 14, 0);
console.log('proxima (continuo 8h desde 07:30, agora 14:00):', fmt(proximaDose({ ...base, uso: 'continuo', frequencia: 'horas', intervaloHoras: 8, primeiraDose: '07:30' }, agora)!));
console.log('proxima (tratamento 3d 1x desde 02/10 10:00, agora 14:00):', fmt(proximaDose({ ...base, uso: 'tratamento', dias: 3, vezesPorDia: 1, inicio: '2026-10-02T10:00' }, agora)!));
console.log('proxima (esporadico):', proximaDose({ ...base, uso: 'esporadico' }, agora));
console.log('data invalida 31/02/2026 ->', lerData('31/02/2026'));
