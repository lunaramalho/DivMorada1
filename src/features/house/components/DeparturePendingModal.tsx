import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { DeparturePending } from '@/services/api';
import { money } from '@/features/debts/installments';

type Props = { name: string; own: boolean; pending: DeparturePending; onClose: () => void; onNavigate: (path: '/debtors' | '/receivables' | '/confirmations') => void };
export function DeparturePendingModal({ name, own, pending, onClose, onNavigate }: Props) {
  return <Modal transparent visible animationType="fade" onRequestClose={onClose}>
    <View style={styles.overlay}><View style={styles.dialog} accessibilityViewIsModal><ScrollView>
      <Text style={styles.title}>{own ? 'Saída bloqueada' : 'Remoção bloqueada'}</Text>
      <Text style={styles.description}>{own
        ? 'Não é possível sair da residência neste momento. Você ainda possui despesas, pagamentos ou recebimentos pendentes. Regularize todas as suas movimentações financeiras antes de sair.'
        : `${name} ainda possui despesas, pagamentos ou recebimentos pendentes. Todas as movimentações financeiras precisam ser regularizadas antes da remoção.`}</Text>
      <Text style={styles.line}>A pagar: {pending.aPagar} · {money(pending.valorAPagar)}</Text>
      <Text style={styles.line}>A receber: {pending.aReceber} · {money(pending.valorAReceber)}</Text>
      <Text style={styles.line}>Pagamentos em análise: {pending.pagamentosEmAnalise}</Text>
      <Text style={styles.line}>Pedidos de parcelamento em análise: {pending.parcelamentosEmAnalise}</Text>
      <Text style={styles.line}>Parcelas pendentes: {pending.parcelas}</Text>
      <Text style={styles.note}>Parcelas e solicitações podem se referir aos valores a pagar ou a receber acima. Saldo líquido zero não significa ausência de pendências.</Text>
      {own && <View style={styles.links}>
        {Number(pending.aPagar)>0 && <Pressable accessibilityRole="button" onPress={() => onNavigate('/debtors')} style={styles.secondary}><Text>Dívidas a Pagar</Text></Pressable>}
        {Number(pending.aReceber)>0 && <Pressable accessibilityRole="button" onPress={() => onNavigate('/receivables')} style={styles.secondary}><Text>Quem Me Deve</Text></Pressable>}
        {(Number(pending.pagamentosEmAnalise)>0 || Number(pending.parcelamentosEmAnalise)>0) && <Pressable accessibilityRole="button" onPress={() => onNavigate('/confirmations')} style={styles.secondary}><Text>Confirmações</Text></Pressable>}
      </View>}
      <Pressable accessibilityRole="button" onPress={onClose} style={styles.primary}><Text style={styles.white}>Entendi</Text></Pressable>
    </ScrollView></View></View>
  </Modal>;
}
const styles = StyleSheet.create({
  overlay: { flex: 1, padding: 16, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  dialog: { backgroundColor: '#fff', borderRadius: 16, padding: 20, width: '100%', maxWidth: 480, maxHeight: '90%' },
  title: { color: '#b33229', fontWeight: '700', fontSize: 20, marginBottom: 12 }, description: { color: '#444', lineHeight: 21, marginBottom: 16 },
  line: { fontSize: 14, color: '#333', marginBottom: 10 }, note: { fontSize: 12, lineHeight: 18, color: '#68716d', marginVertical: 8 },
  links: { gap: 8, marginTop: 8 }, secondary: { padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#ddd', borderRadius: 8 },
  primary: { backgroundColor: '#168f78', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 14 }, white: { color: '#fff', fontWeight: '700' },
});
