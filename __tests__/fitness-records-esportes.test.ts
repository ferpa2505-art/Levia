import { seriesPorGrupoRecords, chaveSemAcento } from '../src/utils/fitnessLogica';
import type { RegistroExercicio } from '../src/types/records';

const hojeISO = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const registro = (nome: string): RegistroExercicio => ({
  id: nome,
  data: hojeISO(),
  horario: '10:00',
  nome,
  duracaoMin: 60,
  kcalGasto: 300,
});

describe('chaveSemAcento', () => {
  it('tira acento e põe em minúsculas', () => {
    expect(chaveSemAcento('Natação')).toBe('natacao');
    expect(chaveSemAcento('Vôlei')).toBe('volei');
    expect(chaveSemAcento('Corrida')).toBe('corrida');
  });
});

describe('seriesPorGrupoRecords com nomes salvos pelo app (com acento)', () => {
  const inicioSemana = '1900-01-01';

  it('natação marca grupos musculares', () => {
    const total = seriesPorGrupoRecords([registro('Natação')], inicioSemana);
    expect(Object.keys(total).length).toBeGreaterThan(0);
    expect(total.costas ?? 0).toBeGreaterThan(0);
  });

  it('corrida e basquete também marcam grupos', () => {
    expect(Object.keys(seriesPorGrupoRecords([registro('Corrida')], inicioSemana)).length).toBeGreaterThan(0);
    expect(Object.keys(seriesPorGrupoRecords([registro('Basquete')], inicioSemana)).length).toBeGreaterThan(0);
  });

  it('esporte sem distribuição (ex.: Alongamento) não marca nada', () => {
    expect(seriesPorGrupoRecords([registro('Alongamento')], inicioSemana)).toEqual({});
  });
});
