import { ReactNode, useEffect, useRef, useState } from 'react';
import {
  DeviceEventEmitter,
  Dimensions,
  Keyboard,
  KeyboardEvent,
  ScrollView,
  StyleProp,
  TextInput,
  ViewStyle,
} from 'react-native';
import { colors, spacing } from '@constants/colors';

/** Evento disparado pelo <Input> ao receber foco (ver Input.tsx) */
export const EVENTO_INPUT_FOCADO = 'levia:inputFocado';

/** Espaço livre entre o campo e o topo do teclado */
const FOLGA = 24;

interface TelaRolavelProps {
  children: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

/**
 * ScrollView das telas com formulário. No Android em tela cheia (edge-to-edge)
 * a janela não encolhe quando o teclado abre, então o campo digitado ficava
 * escondido. Aqui reservamos a altura do teclado no fim do conteúdo e rolamos
 * até o campo focado sempre que o teclado abre ou o foco muda.
 */
export function TelaRolavel({ children, contentContainerStyle }: TelaRolavelProps) {
  const scrollRef = useRef<ScrollView>(null);
  const scrollY = useRef(0);
  const topoTeclado = useRef<number | null>(null);
  const [alturaTeclado, setAlturaTeclado] = useState(0);

  function mostrarCampoFocado() {
    const campo = TextInput.State.currentlyFocusedInput?.();
    const limite = topoTeclado.current;
    if (!campo || limite == null || !scrollRef.current) return;
    campo.measureInWindow((_x, y, _w, h) => {
      const sobra = y + h + FOLGA - limite;
      if (sobra > 0) {
        scrollRef.current?.scrollTo({ y: scrollY.current + sobra, animated: true });
      }
    });
  }

  useEffect(() => {
    const aoAbrir = (e: KeyboardEvent) => {
      topoTeclado.current = e.endCoordinates.screenY || Dimensions.get('window').height - e.endCoordinates.height;
      setAlturaTeclado(e.endCoordinates.height);
      // espera o espaço extra entrar no layout antes de rolar
      setTimeout(mostrarCampoFocado, 60);
    };
    const aoFechar = () => {
      topoTeclado.current = null;
      setAlturaTeclado(0);
    };
    const subs = [
      Keyboard.addListener('keyboardDidShow', aoAbrir),
      Keyboard.addListener('keyboardDidHide', aoFechar),
      DeviceEventEmitter.addListener(EVENTO_INPUT_FOCADO, () => setTimeout(mostrarCampoFocado, 60)),
    ];
    return () => subs.forEach((s) => s.remove());
  }, []);

  return (
    <ScrollView
      ref={scrollRef}
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[{ padding: spacing.lg }, contentContainerStyle, { paddingBottom: spacing.lg + alturaTeclado }]}
      keyboardShouldPersistTaps="handled"
      onScroll={(e) => {
        scrollY.current = e.nativeEvent.contentOffset.y;
      }}
      scrollEventThrottle={16}
    >
      {children}
    </ScrollView>
  );
}
