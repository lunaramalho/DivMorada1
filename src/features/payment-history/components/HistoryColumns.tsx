import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Pagamento } from '@/services/api';

export const money = (amount: number | string) => Number(amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function HistoryColumns({ paid, received, onOpen, totals = true }: { paid: Pagamento[]; received: Pagamento[]; onOpen: (url: string) => void; totals?: boolean }) {
  return <View style={styles.columns}>{[{ title: 'Paguei', items: paid, outgoing: true }, { title: 'Recebi', items: received, outgoing: false }].map(column => (
    <View key={column.title} style={styles.column}>
      <View style={[styles.columnHeader, column.outgoing ? styles.paidCard : styles.receivedCard]}>
        <Text style={styles.heading}>{column.title}</Text>
        {totals && <>
          <Text style={styles.totalLabel}>{column.outgoing ? 'Total pago' : 'Total recebido'}</Text>
          <Text style={[styles.total, column.outgoing ? styles.paid : styles.received]}>{money(column.items.reduce((sum, p) => sum + Number(p.valor), 0))}</Text>
        </>}
        <Text style={styles.count}>{column.items.length} {column.items.length === 1 ? 'pagamento' : 'pagamentos'}</Text>
      </View>
      {column.items.length === 0 && <Text style={styles.empty}>Nenhum registro.</Text>}
      {column.items.map(payment => <View key={payment.id} style={[styles.card, column.outgoing ? styles.paidCard : styles.receivedCard]}>
        <Text style={styles.name}>{payment.despesa?.nome ?? 'Despesa indisponível'}</Text>
        <Text style={styles.value}>{money(payment.valor)}</Text>
        <Text style={styles.detail}>{column.outgoing ? 'Para: ' : 'De: '}{column.outgoing ? payment.despesa?.criadoPor?.nome ?? 'Credor indisponível' : payment.usuario?.nome ?? 'Morador indisponível'}</Text>
        <Text style={styles.detail}>{payment.pagoEm && Number.isFinite(new Date(payment.pagoEm).getTime()) ? new Date(payment.pagoEm).toLocaleDateString('pt-BR') : 'Sem data registrada'}</Text>
        {payment.comprovanteUrl ? <Pressable accessibilityRole="button" accessibilityLabel={`Ver comprovante de ${payment.despesa?.nome ?? 'pagamento'}`} onPress={() => onOpen(payment.comprovanteUrl!)} style={styles.linkButton}><Text style={styles.link}>Ver comprovante</Text></Pressable> : <Text style={styles.empty}>Sem comprovante</Text>}
      </View>)}
    </View>
  ))}</View>;
}
const styles = StyleSheet.create({
  columns: { gap: 20 },
  column: { width: '100%', minWidth: 0 },
  columnHeader: { padding: 12, borderRadius: 8, borderWidth: 1, overflow: 'hidden', marginBottom: 12 },
  paidCard: { backgroundColor: '#fff5f5', borderColor: '#f0dada' },
  receivedCard: { backgroundColor: '#f1faf5', borderColor: '#d4eadd' },
  heading: { fontSize: 17, fontWeight: '700', color: '#333', marginBottom: 8 },
  totalLabel: { fontSize: 12, color: '#555', marginBottom: 4 },
  total: { fontSize: 21, fontWeight: '700', marginBottom: 4 },
  paid: { color: '#bc4545' }, received: { color: '#168f68' }, count: { fontSize: 11, color: '#68716d' },
  card: { padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#e2e6e4', backgroundColor: '#fff', marginBottom: 10, gap: 8 },
  name: { fontWeight: '700', color: '#333', fontSize: 14 }, value: { fontWeight: '700', fontSize: 16, color: '#222' },
  detail: { fontSize: 12, color: '#555' }, empty: { fontSize: 12, color: '#68716d', marginBottom: 8 },
  linkButton: { minHeight: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: '#229c76', borderRadius: 5, paddingHorizontal: 5, marginTop: 4 }, link: { fontSize: 12, fontWeight: '600', color: '#fff', textAlign: 'center' },
});
