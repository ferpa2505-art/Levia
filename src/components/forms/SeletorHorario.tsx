import { useRef } from 'react';
import { View, Pressable } from 'react-native';
import { ChevronUp, ChevronDown, Clock } from 'lucide-react-native';
import { ThemedText } from '@components/ThemedText';
import { usePreferences } from '@context/PreferencesContext';
import { colors, spacing, radius } from '@constants/colors';
import { estilosTema } from '@theme/estilos';

interface Props {
  /** "HH:MM" */
  valor: string;
  onChange: (valor: string) => void;
  /**
   * horario: hora do dia (botão "Agora")
   * duracao: tempo de 00:00 a 23:59, mostrado como "1 h 30 min"
   */
  modo?: 'horario' | 'duracao';
  /** Passo dos minutos (padrão 5; segure o botão para andar rápido) */
  passoMinutos?: number;
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

export function agoraHHMM(): string {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function separar(valor: string): [number, number] {
  const [h, m] = valor.split(':').map((x) => parseInt(x, 10));
  return [isNaN(h) ? 0 : Math.min(23, Math.max(0, h)), isNaN(m) ? 0 : Math.min(59, Math.max(0, m))];
}

/** Botão que repete enquanto está pressionado */
function BotaoPasso({ onPasso, icone }: { onPasso: () => void; icone: 'cima' | 'baixo' }) {
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const parar = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  };
  const Icone = icone === 'cima' ? ChevronUp : ChevronDown;
  return (
    <Pressable
      onPress={onPasso}
      onLongPress={() => {
        parar();
        timer.current = setInterval(onPasso, 90);
      }}
      onPressOut={parar}
      delayLongPress={350}
      hitSlop={6}
      style={({ pressed }) => [styles.botao, pressed && { opacity: 0.6 }]}
    >
      <Icone size={20} color={colors.primary} strokeWidth={2.5} />
    </Pressable>
  );
}

/** Horário (ou duração) ajustado por botões ▲▼ — sem teclado */
export function SeletorHorario({ valor, onChange, modo = 'horario', passoMinutos = 5 }: Props) {
  const { t } = usePreferences();
  const [h, m] = separar(valor);
  // a referência garante que o "segurar para repetir" use sempre o valor mais novo
  const atual = useRef({ h, m });
  atual.current = { h, m };

  const mudarHora = (delta: number) => {
    const nh = (atual.current.h + delta + 24) % 24;
    onChange(`${pad(nh)}:${pad(atual.current.m)}`);
  };
  const mudarMinuto = (delta: number) => {
    let { h: hh, m: mm } = atual.current;
    // ao andar, encaixa no múltiplo do passo (ex.: 14:32 -> 14:35)
    mm = delta > 0 ? Math.floor(mm / passoMinutos) * passoMinutos + passoMinutos : Math.ceil(mm / passoMinutos) * passoMinutos - passoMinutos;
    if (mm >= 60) {
      mm -= 60;
      hh = modo === 'duracao' ? Math.min(23, hh + 1) : (hh + 1) % 24;
    } else if (mm < 0) {
      mm += 60;
      hh = modo === 'duracao' ? Math.max(0, hh - 1) : (hh + 23) % 24;
    }
    if (modo === 'duracao' && hh === 23 && mm > 59) mm = 59;
    onChange(`${pad(hh)}:${pad(mm)}`);
  };

  return (
    <View style={styles.linha}>
      <View style={styles.coluna}>
        <BotaoPasso icone="cima" onPasso={() => mudarHora(1)} />
        <ThemedText variant="title" color="text" style={styles.numero}>{pad(h)}</ThemedText>
        <BotaoPasso icone="baixo" onPasso={() => mudarHora(-1)} />
        {modo === 'duracao' && <ThemedText variant="caption" color="textSecondary">h</ThemedText>}
      </View>
      <ThemedText variant="title" color="textSecondary" style={styles.separador}>:</ThemedText>
      <View style={styles.coluna}>
        <BotaoPasso icone="cima" onPasso={() => mudarMinuto(1)} />
        <ThemedText variant="title" color="text" style={styles.numero}>{pad(m)}</ThemedText>
        <BotaoPasso icone="baixo" onPasso={() => mudarMinuto(-1)} />
        {modo === 'duracao' && <ThemedText variant="caption" color="textSecondary">min</ThemedText>}
      </View>
      {modo === 'horario' && (
        <Pressable onPress={() => onChange(agoraHHMM())} style={styles.agora} hitSlop={6}>
          <Clock size={14} color={colors.primary} strokeWidth={2} />
          <ThemedText variant="small" color="primary" style={{ marginLeft: 4 }}>{t('form.agora')}</ThemedText>
        </Pressable>
      )}
    </View>
  );
}

const styles = estilosTema(() => ({
  linha: { flexDirection: 'row', alignItems: 'center' },
  coluna: { alignItems: 'center' },
  numero: { minWidth: 56, textAlign: 'center', fontVariant: ['tabular-nums'] },
  separador: { marginHorizontal: spacing.xs, marginBottom: 2 },
  botao: {
    width: 44,
    height: 30,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  agora: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.lg,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.primary,
  },
}));
