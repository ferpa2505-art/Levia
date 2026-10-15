import { useState } from 'react';
import { View, Pressable, Alert, ActivityIndicator } from 'react-native';
import { Sparkles, Check, X } from 'lucide-react-native';
import { ThemedText } from '@components/ThemedText';
import { Button } from '@components/Button';
import { Input } from '@components/Input';
import { usePreferences } from '@context/PreferencesContext';
import { idiomaDosAlimentos } from '@constants/alimentosGlobais';
import { valoresDaPorcao } from '@models/ingredients';
import { ItemRefeicao } from '@models/records';
import { analisarFotoDoPrato, darConsentimentoIA, temConsentimentoIA, SugestaoIA } from '@utils/iaPrato';
import { textoNutrientes } from '@utils/textoNutrientes';
import { colors, spacing, radius } from '@constants/colors';
import { estilosTema } from '@theme/estilos';

type Linha = SugestaoIA & { marcado: boolean; gramasTexto: string };

/**
 * Botão "Analisar com IA" + lista de confirmação. A IA sugere; a pessoa
 * marca, corrige os gramas e só então os itens entram na refeição.
 */
export function AnaliseIAPrato({ fotoUri, onAdicionar }: { fotoUri: string; onAdicionar: (itens: ItemRefeicao[]) => void }) {
  const { t, idioma } = usePreferences();
  const [estado, setEstado] = useState<'inicio' | 'analisando' | 'resultado'>('inicio');
  const [linhas, setLinhas] = useState<Linha[]>([]);
  const [restantes, setRestantes] = useState<number | null>(null);

  const numero = (txt: string) => parseFloat(txt.replace(',', '.'));

  async function analisar() {
    setEstado('analisando');
    const r = await analisarFotoDoPrato(fotoUri, idiomaDosAlimentos(idioma));
    if (!r.ok) {
      setEstado('inicio');
      if (r.motivo === 'cota') {
        let quando = '';
        try {
          quando = r.liberaEm ? new Date(r.liberaEm).toLocaleDateString(idioma, { day: '2-digit', month: '2-digit' }) : '';
        } catch {}
        Alert.alert(t('ia.cotaTitulo'), t('ia.cotaMsg', { data: quando }));
      } else {
        Alert.alert(t(`ia.erro.${r.motivo}` as never));
      }
      return;
    }
    setRestantes(r.restantes);
    setLinhas(r.sugestoes.map((s) => ({ ...s, marcado: s.confianca >= 0.4, gramasTexto: String(s.gramas) })));
    setEstado('resultado');
  }

  async function pedirAnalise() {
    if (await temConsentimentoIA()) return analisar();
    Alert.alert(t('ia.consentTitulo'), t('ia.consentMsg'), [
      { text: t('comum.cancelar'), style: 'cancel' },
      {
        text: t('ia.consentOk'),
        onPress: async () => {
          await darConsentimentoIA();
          analisar();
        },
      },
    ]);
  }

  function adicionar() {
    const itens: ItemRefeicao[] = linhas
      .filter((l) => l.marcado && numero(l.gramasTexto) > 0)
      .map((l) => {
        const g = numero(l.gramasTexto);
        return { nome: l.alimento.nome, gramas: g, ...valoresDaPorcao(l.alimento, g) };
      });
    if (itens.length === 0) return;
    onAdicionar(itens);
    setEstado('inicio');
    setLinhas([]);
  }

  if (estado === 'analisando') {
    return (
      <View style={[styles.linha, { marginTop: spacing.md }]}>
        <ActivityIndicator color={colors.primary} />
        <ThemedText variant="small" color="textSecondary" style={{ marginLeft: spacing.sm }}>{t('ia.analisando')}</ThemedText>
      </View>
    );
  }

  if (estado === 'inicio') {
    return (
      <Pressable style={styles.botaoIA} onPress={pedirAnalise}>
        <Sparkles size={18} color={colors.background} strokeWidth={2} />
        <ThemedText variant="body" color="background" style={{ marginLeft: spacing.xs }}>{t('ia.analisar')}</ThemedText>
      </Pressable>
    );
  }

  const marcados = linhas.filter((l) => l.marcado).length;
  return (
    <View style={{ marginTop: spacing.md }}>
      <ThemedText variant="subheading" color="text">{t('ia.encontrei')}</ThemedText>
      <ThemedText variant="caption" color="textSecondary" style={{ marginBottom: spacing.sm }}>{t('ia.confira')}</ThemedText>

      {linhas.map((l, i) => {
        const g = numero(l.gramasTexto);
        const atualizar = (mudanca: Partial<Linha>) => setLinhas((ls) => ls.map((x, k) => (k === i ? { ...x, ...mudanca } : x)));
        return (
          <View key={`${l.nomeIA}-${i}`} style={[styles.item, !l.marcado && { opacity: 0.45 }]}>
            <Pressable onPress={() => atualizar({ marcado: !l.marcado })} hitSlop={8} style={[styles.caixa, l.marcado && styles.caixaMarcada]}>
              {l.marcado && <Check size={14} color={colors.background} strokeWidth={3} />}
            </Pressable>
            <View style={{ flex: 1, marginHorizontal: spacing.sm }}>
              <ThemedText variant="body" color="text">{l.alimento.nome}</ThemedText>
              {l.origem === 'ia' && (
                <ThemedText variant="caption" color="accent">{t('ia.estimado')}</ThemedText>
              )}
              {l.unidades > 1 && (
                <ThemedText variant="caption" color="textSecondary">{t('ia.unidades', { n: l.unidades })}</ThemedText>
              )}
              {g > 0 && <ThemedText variant="caption" color="textSecondary">{textoNutrientes(t, valoresDaPorcao(l.alimento, g))}</ThemedText>}
            </View>
            <Input
              value={l.gramasTexto}
              onChangeText={(v) => atualizar({ gramasTexto: v })}
              keyboardType="decimal-pad"
              style={styles.gramas}
            />
            <ThemedText variant="small" color="textSecondary" style={{ marginLeft: 4 }}>g</ThemedText>
          </View>
        );
      })}

      <View style={[styles.linha, { marginTop: spacing.md, gap: spacing.sm }]}>
        <Button label={t('ia.adicionar', { n: marcados })} size="sm" onPress={adicionar} disabled={marcados === 0} />
        <Pressable onPress={() => setEstado('inicio')} hitSlop={8} style={styles.linha}>
          <X size={14} color={colors.textSecondary} strokeWidth={2} />
          <ThemedText variant="small" color="textSecondary" style={{ marginLeft: 2 }}>{t('ia.descartar')}</ThemedText>
        </Pressable>
      </View>
      {restantes != null && (
        <ThemedText variant="caption" color="textSecondary" style={{ marginTop: spacing.sm }}>{t('ia.restantes', { n: restantes })}</ThemedText>
      )}
    </View>
  );
}

const styles = estilosTema(() => ({
  linha: { flexDirection: 'row', alignItems: 'center' },
  botaoIA: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  caixa: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  caixaMarcada: { backgroundColor: colors.primary },
  gramas: { width: 72, paddingVertical: spacing.xs, paddingHorizontal: spacing.sm, fontSize: 16 },
}));
