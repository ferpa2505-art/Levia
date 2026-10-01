import { useState, useCallback } from 'react';
import { View, ScrollView, Pressable, Modal } from 'react-native';
import { TelaRolavel } from '@components/TelaRolavel';
import {
  Droplet,
  Pill,
  UtensilsCrossed,
  FileText,
  Plus,
  Trash2,
  Clock,
} from 'lucide-react-native';
import { ThemedView } from '@components/ThemedView';
import { ThemedText } from '@components/ThemedText';
import { Button } from '@components/Button';
import { Input } from '@components/Input';
import { ConfiguradorAlarmesMedicacao, StatusAlarmeIndicador } from '@components/diabetes';
import { useDiabetes } from '@context/DiabetesContext';
import { MEDICAMENTOS_DIABETES, TIPOS_REFEICAO } from '@constants/diabetes';
import { colors, spacing, radius } from '@constants/colors';
import { estilosTema } from '@theme/estilos';
import { useT } from '@context/PreferencesContext';

export default function DiabetesScreen() {
  const t = useT();
  const {
    glicemiaHoje,
    ultimaGlicemia,
    mediaGlicemiaHoje,
    medicacoes,
    refeicoes,
    notas,
    adicionarGlicemia,
    removerGlicemia,
    adicionarMedicacao,
    removerMedicacao,
    atualizarAlarmeMedicacao,
    adicionarRefeicao,
    removerRefeicao,
    adicionarNota,
    removerNota,
  } = useDiabetes();

  // Filtrar medicações e refeições do dia
  const hoje = new Date().toISOString().split('T')[0];
  const medicacoesHoje = medicacoes.filter((m) => m.data === hoje);
  const refeicoesHoje = refeicoes.filter((r) => r.data === hoje);
  const notasHoje = notas.filter((n) => n.data === hoje);

  // Estados para adicionar registros
  const [mostrarFormGlicemia, setMostrarFormGlicemia] = useState(false);
  const [glicemiaTexto, setGlicemiaTexto] = useState('');
  const [unidadeGlicemia, setUnidadeGlicemia] = useState('mg/dL');
  const [notasGlicemia, setNotasGlicemia] = useState('');

  const [mostrarFormMedicacao, setMostrarFormMedicacao] = useState(false);
  const [medicamentoSelecionado, setMedicamentoSelecionado] = useState(MEDICAMENTOS_DIABETES[0]);
  const [dosagemMedicacao, setDosagemMedicacao] = useState('');
  const [observacoesMedicacao, setObservacoesMedicacao] = useState('');

  // Estados para configuração de alarmes
  const [mostrarConfiguradorAlarmes, setMostrarConfiguradorAlarmes] = useState(false);
  const [medicacaoSelecionadaAlarme, setMedicacaoSelecionadaAlarme] = useState<any>(null);

  const [mostrarFormRefeicao, setMostrarFormRefeicao] = useState(false);
  const [tipoRefeicaoSelecionado, setTipoRefeicaoSelecionado] = useState(TIPOS_REFEICAO[0]);
  const [carboidratosTexto, setCarboidratosTexto] = useState('');
  const [alimentosRefeicao, setAlimentosRefeicao] = useState('');
  const [observacoesRefeicao, setObservacoesRefeicao] = useState('');

  const [mostrarFormNota, setMostrarFormNota] = useState(false);
  const [conteudoNota, setConteudoNota] = useState('');

  // Funções para alarmes
  const abrirConfigurador = useCallback((medicacao: any) => {
    setMedicacaoSelecionadaAlarme(medicacao);
    setMostrarConfiguradorAlarmes(true);
  }, []);

  const fecharConfigurador = useCallback(() => {
    setMostrarConfiguradorAlarmes(false);
    setMedicacaoSelecionadaAlarme(null);
  }, []);

  // Funções para salvar registros
  async function salvarGlicemia() {
    const valor = parseFloat(glicemiaTexto.replace(',', '.'));
    if (!isNaN(valor) && valor > 0) {
      await adicionarGlicemia(valor, unidadeGlicemia, notasGlicemia || undefined);
      setGlicemiaTexto('');
      setNotasGlicemia('');
      setMostrarFormGlicemia(false);
    }
  }

  async function salvarMedicacao() {
    if (dosagemMedicacao.trim()) {
      await adicionarMedicacao(medicamentoSelecionado, dosagemMedicacao, observacoesMedicacao || undefined);
      setDosagemMedicacao('');
      setObservacoesMedicacao('');
      setMostrarFormMedicacao(false);
    }
  }

  async function salvarRefeicao() {
    const carbos = parseFloat(carboidratosTexto.replace(',', '.'));
    if (!isNaN(carbos) && carbos > 0) {
      await adicionarRefeicao(
        tipoRefeicaoSelecionado,
        carbos,
        alimentosRefeicao || undefined,
        observacoesRefeicao || undefined
      );
      setCarboidratosTexto('');
      setAlimentosRefeicao('');
      setObservacoesRefeicao('');
      setMostrarFormRefeicao(false);
    }
  }

  async function salvarNota() {
    if (conteudoNota.trim()) {
      await adicionarNota(conteudoNota);
      setConteudoNota('');
      setMostrarFormNota(false);
    }
  }

  return (
    <TelaRolavel>
      <ThemedView style={styles.container}>
        {/* Resumo da Glicemia */}
        <ThemedView variant="surface" style={[styles.card, styles.cardShadow]}>
          <View style={styles.header}>
            <View style={styles.headerTitulo}>
              <Droplet size={20} color={colors.primary} strokeWidth={2} />
              <ThemedText variant="subheading" color="text" style={{ marginLeft: spacing.xs }}>
                Glicemia
              </ThemedText>
            </View>
            <Button label="+" variant="primary" size="sm" onPress={() => setMostrarFormGlicemia(true)} />
          </View>

          {mostrarFormGlicemia && (
            <View style={styles.formulario}>
              <Input
                value={glicemiaTexto}
                onChangeText={setGlicemiaTexto}
                keyboardType="decimal-pad"
                placeholder="Valor"
                autoFocus
              />
              <View style={styles.inputRow}>
                <View style={{ flex: 1 }}>
                  <ThemedText
                    variant="small"
                    color="textSecondary"
                    style={{ marginBottom: spacing.xs }}
                  >
                    Unidade
                  </ThemedText>
                  <Pressable
                    style={[styles.selectButton, { backgroundColor: colors.primarySoft }]}
                    onPress={() =>
                      setUnidadeGlicemia(unidadeGlicemia === 'mg/dL' ? 'mmol/L' : 'mg/dL')
                    }
                  >
                    <ThemedText variant="body" color="primary">
                      {unidadeGlicemia}
                    </ThemedText>
                  </Pressable>
                </View>
              </View>
              <Input
                value={notasGlicemia}
                onChangeText={setNotasGlicemia}
                placeholder="Notas (opcional)"
                multiline
                numberOfLines={2}
              />
              <View style={styles.formButtons}>
                <Button
                  label="Cancelar"
                  variant="outline"
                  size="sm"
                  onPress={() => {
                    setMostrarFormGlicemia(false);
                    setGlicemiaTexto('');
                    setNotasGlicemia('');
                  }}
                  style={{ marginRight: spacing.md }}
                />
                <Button label="Salvar" variant="primary" size="sm" onPress={salvarGlicemia} />
              </View>
            </View>
          )}

          {ultimaGlicemia && (
            <View style={styles.resumoGlicemia}>
              <View style={styles.resumoItem}>
                <ThemedText variant="small" color="textSecondary">
                  Última
                </ThemedText>
                <ThemedText variant="heading" color="primary">
                  {ultimaGlicemia.valor}
                </ThemedText>
                <ThemedText variant="small" color="textSecondary">
                  {ultimaGlicemia.unidade}
                </ThemedText>
              </View>
              <View style={styles.resumoItem}>
                <ThemedText variant="small" color="textSecondary">
                  Média
                </ThemedText>
                <ThemedText variant="heading" color="secondary">
                  {mediaGlicemiaHoje}
                </ThemedText>
                <ThemedText variant="small" color="textSecondary">
                  mg/dL
                </ThemedText>
              </View>
              <View style={styles.resumoItem}>
                <ThemedText variant="small" color="textSecondary">
                  Registros
                </ThemedText>
                <ThemedText variant="heading" color="accent">
                  {glicemiaHoje.length}
                </ThemedText>
              </View>
            </View>
          )}

          {/* Histórico de Glicemias */}
          {glicemiaHoje.length > 0 && (
            <View style={{ marginTop: spacing.lg }}>
              <ThemedText variant="subheading" color="text" style={{ marginBottom: spacing.md }}>
                Histórico
              </ThemedText>
              {glicemiaHoje.map((g) => (
                <View key={g.id} style={styles.registroItem}>
                  <View style={styles.registroConteudo}>
                    <ThemedText variant="body" color="text">
                      {g.horario} - {g.valor} {g.unidade}
                    </ThemedText>
                    {g.notas && (
                      <ThemedText
                        variant="small"
                        color="textSecondary"
                        style={{ marginTop: spacing.xs }}
                      >
                        {g.notas}
                      </ThemedText>
                    )}
                  </View>
                  <Pressable onPress={() => removerGlicemia(g.id)}>
                    <Trash2 size={18} color={colors.error} strokeWidth={2} />
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </ThemedView>

        {/* Medicações */}
        <ThemedView variant="surface" style={[styles.card, styles.cardShadow]}>
          <View style={styles.header}>
            <View style={styles.headerTitulo}>
              <Pill size={20} color={colors.secondary} strokeWidth={2} />
              <ThemedText variant="subheading" color="text" style={{ marginLeft: spacing.xs }}>
                Medicações
              </ThemedText>
            </View>
            <Button
              label="+"
              variant="secondary"
              size="sm"
              onPress={() => setMostrarFormMedicacao(true)}
            />
          </View>

          {mostrarFormMedicacao && (
            <View style={styles.formulario}>
              <View>
                <ThemedText
                  variant="small"
                  color="textSecondary"
                  style={{ marginBottom: spacing.xs }}
                >
                  Medicamento
                </ThemedText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.selectButtons}>
                    {MEDICAMENTOS_DIABETES.map((med) => (
                      <Pressable
                        key={med}
                        style={[
                          styles.selectButton,
                          {
                            backgroundColor:
                              medicamentoSelecionado === med
                                ? colors.secondary
                                : colors.secondarySoft,
                          },
                        ]}
                        onPress={() => setMedicamentoSelecionado(med)}
                      >
                        <ThemedText
                          variant="small"
                          color={medicamentoSelecionado === med ? 'primary' : 'text'}
                        >
                          {med}
                        </ThemedText>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              </View>
              <Input
                value={dosagemMedicacao}
                onChangeText={setDosagemMedicacao}
                placeholder="Dosagem (ex: 500mg)"
              />
              <Input
                value={observacoesMedicacao}
                onChangeText={setObservacoesMedicacao}
                placeholder="Observações (opcional)"
              />
              <View style={styles.formButtons}>
                <Button
                  label="Cancelar"
                  variant="outline"
                  size="sm"
                  onPress={() => {
                    setMostrarFormMedicacao(false);
                    setDosagemMedicacao('');
                    setObservacoesMedicacao('');
                  }}
                  style={{ marginRight: spacing.md }}
                />
                <Button
                  label="Salvar"
                  variant="secondary"
                  size="sm"
                  onPress={salvarMedicacao}
                />
              </View>
            </View>
          )}

          {medicacoesHoje.length > 0 && (
            <View>
              {medicacoesHoje.map((med) => (
                <View key={med.id}>
                  <View style={styles.registroItem}>
                    <View style={styles.registroConteudo}>
                      <ThemedText variant="body" color="text">
                        {med.horario} - {med.medicamento}
                      </ThemedText>
                      <ThemedText variant="small" color="textSecondary">
                        {med.dosagem}
                      </ThemedText>
                      {med.observacoes && (
                        <ThemedText variant="small" color="textSecondary">
                          {med.observacoes}
                        </ThemedText>
                      )}
                    </View>
                    <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
                      <Pressable onPress={() => abrirConfigurador(med)}>
                        <Clock size={18} color={colors.primary} strokeWidth={2} />
                      </Pressable>
                      <Pressable onPress={() => removerMedicacao(med.id)}>
                        <Trash2 size={18} color={colors.error} strokeWidth={2} />
                      </Pressable>
                    </View>
                  </View>
                  <StatusAlarmeIndicador medicacao={med} />
                </View>
              ))}
            </View>
          )}

          {medicacoesHoje.length === 0 && !mostrarFormMedicacao && (
            <ThemedText variant="small" color="textSecondary" style={{ marginTop: spacing.md }}>
              Nenhuma medicação registrada hoje
            </ThemedText>
          )}
        </ThemedView>

        {/* Refeições */}
        <ThemedView variant="surface" style={[styles.card, styles.cardShadow]}>
          <View style={styles.header}>
            <View style={styles.headerTitulo}>
              <UtensilsCrossed size={20} color={colors.accent} strokeWidth={2} />
              <ThemedText variant="subheading" color="text" style={{ marginLeft: spacing.xs }}>
                Refeições
              </ThemedText>
            </View>
            <Button
              label="+"
              variant="secondary"
              size="sm"
              onPress={() => setMostrarFormRefeicao(true)}
            />
          </View>

          {mostrarFormRefeicao && (
            <View style={styles.formulario}>
              <View>
                <ThemedText
                  variant="small"
                  color="textSecondary"
                  style={{ marginBottom: spacing.xs }}
                >
                  Tipo de Refeição
                </ThemedText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.selectButtons}>
                    {TIPOS_REFEICAO.map((tipo) => (
                      <Pressable
                        key={tipo}
                        style={[
                          styles.selectButton,
                          {
                            backgroundColor:
                              tipoRefeicaoSelecionado === tipo
                                ? colors.accent
                                : colors.accentSoft,
                          },
                        ]}
                        onPress={() => setTipoRefeicaoSelecionado(tipo)}
                      >
                        <ThemedText
                          variant="small"
                          color={tipoRefeicaoSelecionado === tipo ? 'primary' : 'text'}
                        >
                          {tipo.split(' ')[0]}
                        </ThemedText>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              </View>
              <Input
                value={carboidratosTexto}
                onChangeText={setCarboidratosTexto}
                keyboardType="decimal-pad"
                placeholder="Carboidratos (g)"
              />
              <Input
                value={alimentosRefeicao}
                onChangeText={setAlimentosRefeicao}
                placeholder="Alimentos (opcional)"
                multiline
              />
              <Input
                value={observacoesRefeicao}
                onChangeText={setObservacoesRefeicao}
                placeholder="Observações (opcional)"
              />
              <View style={styles.formButtons}>
                <Button
                  label="Cancelar"
                  variant="outline"
                  size="sm"
                  onPress={() => {
                    setMostrarFormRefeicao(false);
                    setCarboidratosTexto('');
                    setAlimentosRefeicao('');
                    setObservacoesRefeicao('');
                  }}
                  style={{ marginRight: spacing.md }}
                />
                <Button
                  label="Salvar"
                  variant="secondary"
                  size="sm"
                  onPress={salvarRefeicao}
                />
              </View>
            </View>
          )}

          {refeicoesHoje.length > 0 && (
            <View>
              {refeicoesHoje.map((ref) => (
                <View key={ref.id} style={styles.registroItem}>
                  <View style={styles.registroConteudo}>
                    <ThemedText variant="body" color="text">
                      {ref.horario} - {ref.tipo}
                    </ThemedText>
                    <ThemedText variant="small" color="textSecondary">
                      {ref.carboidratos}g de carboidratos
                    </ThemedText>
                    {ref.alimentos && (
                      <ThemedText variant="small" color="textSecondary">
                        {ref.alimentos}
                      </ThemedText>
                    )}
                  </View>
                  <Pressable onPress={() => removerRefeicao(ref.id)}>
                    <Trash2 size={18} color={colors.error} strokeWidth={2} />
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          {refeicoesHoje.length === 0 && !mostrarFormRefeicao && (
            <ThemedText variant="small" color="textSecondary" style={{ marginTop: spacing.md }}>
              Nenhuma refeição registrada hoje
            </ThemedText>
          )}
        </ThemedView>

        {/* Notas */}
        <ThemedView variant="surface" style={[styles.card, styles.cardShadow]}>
          <View style={styles.header}>
            <View style={styles.headerTitulo}>
              <FileText size={20} color={colors.textSecondary} strokeWidth={2} />
              <ThemedText variant="subheading" color="text" style={{ marginLeft: spacing.xs }}>
                Notas
              </ThemedText>
            </View>
            <Button label="+" variant="outline" size="sm" onPress={() => setMostrarFormNota(true)} />
          </View>

          {mostrarFormNota && (
            <View style={styles.formulario}>
              <Input
                value={conteudoNota}
                onChangeText={setConteudoNota}
                placeholder="Adicione uma nota..."
                multiline
                numberOfLines={4}
              />
              <View style={styles.formButtons}>
                <Button
                  label="Cancelar"
                  variant="outline"
                  size="sm"
                  onPress={() => {
                    setMostrarFormNota(false);
                    setConteudoNota('');
                  }}
                  style={{ marginRight: spacing.md }}
                />
                <Button label="Salvar" variant="outline" size="sm" onPress={salvarNota} />
              </View>
            </View>
          )}

          {notasHoje.length > 0 && (
            <View>
              {notasHoje.map((nota) => (
                <View key={nota.id} style={styles.notaItem}>
                  <View style={styles.registroConteudo}>
                    <ThemedText variant="small" color="textSecondary">
                      {nota.timestamp}
                    </ThemedText>
                    <ThemedText variant="body" color="text" style={{ marginTop: spacing.xs }}>
                      {nota.conteudo}
                    </ThemedText>
                  </View>
                  <Pressable onPress={() => removerNota(nota.id)}>
                    <Trash2 size={18} color={colors.error} strokeWidth={2} />
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          {notasHoje.length === 0 && !mostrarFormNota && (
            <ThemedText variant="small" color="textSecondary" style={{ marginTop: spacing.md }}>
              Nenhuma nota registrada hoje
            </ThemedText>
          )}
        </ThemedView>

        <View style={styles.spacer} />
      </ThemedView>

      {/* Modal Configurador de Alarmes */}
      <Modal
        visible={mostrarConfiguradorAlarmes}
        transparent
        animationType="slide"
        onRequestClose={fecharConfigurador}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          {medicacaoSelecionadaAlarme && (
            <ConfiguradorAlarmesMedicacao
              medicacao={medicacaoSelecionadaAlarme}
              onConfirm={async (alarme) => {
                await atualizarAlarmeMedicacao(medicacaoSelecionadaAlarme.id, alarme);
                fecharConfigurador();
              }}
              onCancel={fecharConfigurador}
            />
          )}
        </View>
      </Modal>
    </TelaRolavel>
  );
}

const styles = estilosTema(() => ({
  container: { flex: 1 },
  card: { padding: spacing.lg, marginBottom: spacing.lg, borderRadius: radius.xl },
  cardShadow: {
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerTitulo: { flexDirection: 'row', alignItems: 'center' },
  formulario: {
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
  },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', marginVertical: spacing.sm },
  selectButtons: { flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.sm },
  selectButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    marginRight: spacing.sm,
  },
  formButtons: { flexDirection: 'row', marginTop: spacing.md, justifyContent: 'flex-end' },
  resumoGlicemia: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopColor: colors.border,
    borderTopWidth: 1,
  },
  resumoItem: { alignItems: 'center' },
  registroItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
  },
  registroConteudo: { flex: 1 },
  notaItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
  },
  spacer: { height: spacing.lg },
}));
