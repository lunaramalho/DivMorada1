import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { getApiErrorMessage } from '@/services/api';
import type { DebtPayment } from '../types';
import { dateFromInput, displayDate, installmentPlan, money, todayISO } from '../installments';

type Props = { payment: DebtPayment; busy: boolean; onClose: () => void; onSubmit: (count: number, first: string) => Promise<void> };

export function InstallmentReview({ payment, busy, onClose, onSubmit }: Props) {
  const [count, setCount] = useState(2);
  const [date, setDate] = useState(displayDate(todayISO()));
  const [error, setError] = useState('');
  const first = dateFromInput(date);
  let validation = '';
  let plan: ReturnType<typeof installmentPlan> = [];
  try {
    if (!first) throw new Error('Informe a data no formato DD/MM/AAAA.');
    if (first < todayISO()) throw new Error('O primeiro vencimento deve ser a partir de hoje.');
    plan = installmentPlan(payment.valor, count, first);
  } catch (err) { validation = (err as Error).message; }
  const submit = async () => {
    if (busy || validation || !first) return;
    setError('');
    try { await onSubmit(count, first); }
    catch (err) { setError(getApiErrorMessage(err as Parameters<typeof getApiErrorMessage>[0], 'Não foi possível enviar a solicitação.')); }
  };
  return <Modal transparent visible animationType="fade" onRequestClose={onClose}>
    <View style={styles.overlay}><View style={styles.dialog} accessibilityViewIsModal>
      <ScrollView keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Solicitar parcelamento</Text>
        <Text style={styles.detail}>{payment.despesa?.nome ?? 'Despesa'}</Text>
        <Text style={styles.detail}>Credor: {payment.despesa?.criadoPor?.nome ?? 'Morador'}</Text>
        <Text style={styles.total}>Total: {money(payment.valor)}</Text>
        <Text style={styles.label}>Quantidade de parcelas</Text>
        <View style={styles.choices}>{Array.from({ length: 11 }, (_, i) => i + 2).map(number => {
          const disabled = busy || number > Math.round(Number(payment.valor) * 100);
          return <Pressable key={number} accessibilityRole="button" accessibilityLabel={`${number} parcelas`} accessibilityState={{ selected: count === number, disabled }} disabled={disabled}
            onPress={() => { setCount(number); setError(''); }} style={[styles.choice, count === number && styles.active, disabled && styles.disabled]}>
            <Text style={count === number ? styles.white : styles.detail}>{number}x</Text>
          </Pressable>;
        })}</View>
        <Text style={styles.label}>Primeiro vencimento</Text>
        <TextInput accessibilityLabel="Data da primeira parcela" editable={!busy} value={date} onChangeText={value => { setDate(value); setError(''); }} placeholder="DD/MM/AAAA" maxLength={10} style={styles.input} keyboardType="numbers-and-punctuation" />
        <Text style={styles.note}>Sem juros. Os próximos vencimentos seguem o mesmo dia de cada mês. O credor verá este calendário antes de aprovar.</Text>
        {plan.map(part => <View key={part.numero} style={styles.part}><Text>Parcela {part.numero}/{count}</Text><Text>{displayDate(part.vencimento)}</Text><Text style={styles.bold}>{money(part.valor)}</Text></View>)}
        {(validation || error) ? <Text accessibilityRole="alert" style={styles.error}>{validation || error}</Text> : null}
        <Pressable accessibilityRole="button" disabled={busy || !!validation} onPress={() => void submit()} style={[styles.primary, (busy || !!validation) && styles.disabled]}><Text style={styles.white}>{busy ? 'Enviando...' : 'Enviar solicitação'}</Text></Pressable>
        <Pressable accessibilityRole="button" disabled={busy} onPress={onClose} style={styles.secondary}><Text>Cancelar</Text></Pressable>
      </ScrollView>
    </View></View>
  </Modal>;
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', padding: 16, justifyContent: 'center', alignItems: 'center' },
  dialog: { width: '100%', maxWidth: 480, maxHeight: '90%', padding: 20, backgroundColor: '#fff', borderRadius: 16 },
  title: { fontSize: 20, fontWeight: '700', color: '#222', marginBottom: 14 },
  detail: { color: '#555', marginBottom: 4 }, total: { fontSize: 18, fontWeight: '700', color: '#168f78', marginVertical: 8 },
  label: { color: '#333', fontWeight: '600', marginTop: 12, marginBottom: 8 },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, choice: { borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 8, minWidth: 48, alignItems: 'center' },
  active: { backgroundColor: '#168f78', borderColor: '#168f78' }, white: { color: '#fff', fontWeight: '700' },
  input: { padding: 12, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, fontSize: 16, color: '#222' },
  note: { color: '#666', fontSize: 13, lineHeight: 19, marginVertical: 12 },
  part: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8, paddingVertical: 10, borderBottomWidth: 1, borderColor: '#eee' }, bold: { fontWeight: '700' },
  error: { color: '#b33229', marginTop: 12 }, primary: { backgroundColor: '#1abc9c', alignItems: 'center', padding: 14, borderRadius: 8, marginTop: 16 },
  secondary: { padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, marginTop: 8 }, disabled: { opacity: 0.5 },
});
