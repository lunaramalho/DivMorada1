import { useState } from 'react';
import { ActivityIndicator, Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useConfirmations } from '@/features/confirmations/useConfirmations';
import { displayDate, installmentPlan, money } from '@/features/debts/installments';
import { ReceiptViewer } from '@/features/payment-history/components/ReceiptViewer';
import type { PaymentRequest } from '@/services/paymentRequests';
import { protectedFileURL } from '@/services/protectedStorage';

const statusLabels: Record<PaymentRequest['status'], string> = {
  PENDENTE: 'Aguardando análise', APROVADA: 'Aprovada', RECUSADA: 'Recusada', CANCELADA: 'Cancelada pelo devedor', ENCERRADA: 'Encerrada por recebimento direto',
};

export default function ConfirmationsScreen() {
  const { router, requests, loading, busy, error, load, resolve } = useConfirmations();
  const [type, setType] = useState<PaymentRequest['tipo']>('PAGAMENTO');
  const [showHistory, setShowHistory] = useState(false);
  const [receipt, setReceipt] = useState<string | null>(null);
  const [receiptError, setReceiptError] = useState('');
  const openReceipt = async (url: string) => {
    setReceiptError('');
    try {
      const signed = await protectedFileURL(url);
      if (/\.pdf(?:[?#]|$)/i.test(url)) await Linking.openURL(signed);
      else setReceipt(signed);
    } catch (err) { setReceiptError(err instanceof Error ? err.message : 'Não foi possível abrir o comprovante.'); }
  };
  const filtered = requests.filter(request => request.tipo === type && (showHistory ? request.status !== 'PENDENTE' : request.status === 'PENDENTE'));
  return <SafeAreaView style={styles.safe}>
    <View style={styles.header}>
      <Pressable accessibilityRole="button" accessibilityLabel="Voltar" style={styles.back} onPress={() => router.canGoBack() ? router.back() : router.replace('/')}><Text style={styles.arrow}>‹</Text></Pressable>
      <Text style={styles.brand}>DivMorada</Text>
    </View>
    <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} />}>
      <Text style={styles.title}>Confirmações</Text>
      <Text style={styles.subtitle}>Confira os pagamentos informados e as propostas de parcelamento de quem deve a você.</Text>
      <View style={styles.tabs}>{([{ value: 'PAGAMENTO', label: 'Pagamentos' }, { value: 'PARCELAMENTO', label: 'Parcelamentos' }] as const).map(tab => {
        const count = requests.filter(request => request.tipo === tab.value && request.status === 'PENDENTE').length;
        return <Pressable key={tab.value} accessibilityRole="button" accessibilityState={{ selected: type === tab.value }} onPress={() => setType(tab.value)} style={[styles.tab, type === tab.value && styles.activeTab]}>
          <Text style={[styles.tabText, type === tab.value && styles.activeTabText]}>{tab.label} ({count})</Text>
        </Pressable>;
      })}</View>
      <Pressable accessibilityRole="button" onPress={() => setShowHistory(value => !value)} style={styles.history}><Text style={styles.link}>{showHistory ? 'Ver solicitações pendentes' : 'Ver solicitações encerradas'}</Text></Pressable>
      {receiptError ? <Text accessibilityRole="alert" style={styles.error}>{receiptError}</Text> : null}
      {error ? <View><Text accessibilityRole="alert" style={styles.error}>{error}</Text><Pressable accessibilityRole="button" style={styles.retry} onPress={() => void load()}><Text>Tentar novamente</Text></Pressable></View> : null}
      {loading ? <ActivityIndicator color="#168f78" style={styles.loading} /> : !error && <>
        {filtered.length === 0 && <View style={styles.empty}><Text style={styles.emptyTitle}>Nenhuma solicitação {showHistory ? 'encerrada' : 'pendente'}</Text><Text style={styles.subtitle}>As solicitações desta categoria aparecerão aqui.</Text></View>}
        {filtered.map(request => <View key={request.id} style={styles.card}>
          <View style={styles.cardTop}><View style={styles.info}><Text style={styles.name}>{request.devedor?.nome ?? 'Morador'}</Text><Text style={styles.detail}>{request.pagamento?.despesa?.nome ?? 'Despesa'}</Text></View><Text style={styles.amount}>{money(request.valor)}</Text></View>
          {request.pagamento?.numeroParcela != null && <Text style={styles.detail}>Parcela {request.pagamento.numeroParcela}/{request.pagamento.totalParcelas}</Text>}
          <Text style={styles.detail}>Enviada em {new Date(request.createdAt).toLocaleDateString('pt-BR')}</Text>
          <Text style={styles.status}>{statusLabels[request.status]}</Text>
          {request.tipo === 'PAGAMENTO' ? <>
            <Text style={styles.subtitle}>O devedor informou que pagou. Confirme somente após conferir o recebimento.</Text>
            {request.comprovanteUrl ? <Pressable accessibilityRole="button" style={styles.receipt} onPress={() => void openReceipt(request.comprovanteUrl!)}><Text style={styles.link}>Ver comprovante</Text></Pressable> : <Text style={styles.detail}>Pagamento informado sem comprovante.</Text>}
          </> : <>
            <Text style={styles.detail}>{request.quantidade} parcelas · Sem juros</Text>
            {installmentPlan(request.valor, request.quantidade!, request.primeiroVencimento!).map(part => <View key={part.numero} style={styles.part}><Text style={styles.detail}>Parcela {part.numero}/{request.quantidade}</Text><Text style={styles.detail}>{displayDate(part.vencimento)}</Text><Text style={styles.partAmount}>{money(part.valor)}</Text></View>)}
          </>}
          {request.status === 'PENDENTE' && <View style={styles.actions}>
            <Pressable accessibilityRole="button" disabled={busy} style={[styles.approve, busy && styles.disabled]} onPress={() => resolve(request, true)}><Text style={styles.approveText}>{busy ? 'Aguarde...' : request.tipo === 'PAGAMENTO' ? 'Confirmar recebimento' : 'Aprovar parcelamento'}</Text></Pressable>
            <Pressable accessibilityRole="button" disabled={busy} style={[styles.reject, busy && styles.disabled]} onPress={() => resolve(request, false)}><Text style={styles.rejectText}>Recusar</Text></Pressable>
          </View>}
        </View>)}
      </>}
    </ScrollView>
    {receipt && <ReceiptViewer key={receipt} url={receipt} onClose={() => setReceipt(null)} />}
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f4f6f5' }, header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' },
  back: { padding: 4, marginRight: 10 }, arrow: { fontSize: 30, color: '#1abc9c', lineHeight: 32 }, brand: { color: '#1abc9c', fontSize: 20, fontWeight: '700' },
  content: { padding: 16, paddingBottom: 40, width: '100%', maxWidth: 900, alignSelf: 'center' }, title: { color: '#333', fontSize: 22, fontWeight: '700', marginBottom: 8 },
  subtitle: { color: '#68716d', fontSize: 13, lineHeight: 20, marginBottom: 12 }, tabs: { flexDirection: 'row', gap: 8, marginTop: 6 },
  tab: { flex: 1, minWidth: 0, borderRadius: 10, borderWidth: 1, borderColor: '#d4dfda', backgroundColor: '#fff', paddingVertical: 14, paddingHorizontal: 6, alignItems: 'center' },
  activeTab: { backgroundColor: '#168f78', borderColor: '#168f78' }, tabText: { color: '#555', fontWeight: '600', fontSize: 13 }, activeTabText: { color: '#fff' }, history: { paddingVertical: 16 }, link: { color: '#168f78', fontWeight: '600' },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 14, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 }, info: { flex: 1, minWidth: 0 }, name: { fontSize: 16, color: '#222', fontWeight: '700', marginBottom: 4 }, amount: { color: '#222', fontWeight: '700', fontSize: 17 },
  detail: { color: '#68716d', fontSize: 13, marginBottom: 6 }, status: { color: '#805c17', fontWeight: '600', marginVertical: 8, fontSize: 13 },
  part: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8, paddingVertical: 8, borderBottomWidth: 1, borderColor: '#eee' }, partAmount: { fontSize: 13, color: '#333', fontWeight: '600' },
  receipt: { minHeight: 44, justifyContent: 'center', marginBottom: 8 }, actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  approve: { flexGrow: 1, padding: 14, backgroundColor: '#1abc9c', borderRadius: 8, alignItems: 'center' }, approveText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  reject: { padding: 14, borderWidth: 1, borderColor: '#e6b4ae', borderRadius: 8, alignItems: 'center' }, rejectText: { color: '#b33229', fontWeight: '600', fontSize: 13 },
  empty: { padding: 24, backgroundColor: '#fff', borderRadius: 14, alignItems: 'center' }, emptyTitle: { fontWeight: '700', color: '#333', marginBottom: 8 },
  error: { color: '#b33229', marginBottom: 12 }, retry: { padding: 14, backgroundColor: '#fff', borderRadius: 8, alignItems: 'center', marginBottom: 12 }, loading: { margin: 24 }, disabled: { opacity: 0.5 },
});
