import { TelaRolavel } from '@components/TelaRolavel';
import { GraficoNutricao } from '@components/GraficoNutricao';

/** Gráfico configurável: alimentação × peso e glicemia */
export default function GraficoNutricaoScreen() {
  return (
    <TelaRolavel>
      <GraficoNutricao />
    </TelaRolavel>
  );
}
