import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { ActivityIndicator, Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { HistoryColumns } from '@/features/payment-history/components/HistoryColumns';
import { ReceiptViewer } from '@/features/payment-history/components/ReceiptViewer';
import { usePaymentHistory } from '@/features/payment-history/hooks/usePaymentHistory';

export default function PaymentHistoryScreen() {
  const history = usePaymentHistory();
  const [receipt, setReceipt] = useState<string | null>(null);
  const [receiptError, setReceiptError] = useState('');
  const openReceipt = async (url: string) => {
    setReceiptError('');
    if (/\.pdf(?:[?#]|$)/i.test(url)) {
      try { await Linking.openURL(url); } catch { setReceiptError('Não foi possível abrir o PDF.'); }
    } else setReceipt(url);
  };
  return <SafeAreaView style={styles.safe}>
    <View style={styles.header}><Pressable accessibilityRole="button" accessibilityLabel="Voltar" onPress={() => history.router.canGoBack() ? history.router.back() : history.router.replace('/profile')} style={styles.back}><Text style={styles.arrow}>‹</Text></Pressable><Text style={styles.brand}>DivMorada</Text></View>
    <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={history.loading} onRefresh={() => void history.load()} />}>
      <View style={styles.titleBar}><Text style={styles.title}>Meu histórico de pagamentos</Text></View>
      <Text style={styles.subtitle}>Pagamentos e recebimentos da sua casa atual.</Text>
      <View style={styles.filterPanel}>
      <Text style={styles.filterTitle}>Consultar período</Text>
      <View style={styles.filters}>{[{ label: 'Data inicial', value: history.start, set: history.setStart }, { label: 'Data final', value: history.end, set: history.setEnd }].map(field => <View style={styles.field} key={field.label}><Text style={styles.label}>{field.label}</Text><TextInput accessibilityLabel={field.label} value={field.value} onChangeText={field.set} placeholder="DD/MM/AAAA" maxLength={10} keyboardType="numbers-and-punctuation" style={styles.input} /></View>)}</View>
      <Text style={styles.subtitle}>DD/MM/AAAA · Data de confirmação do pagamento</Text>
      </View>
      {history.rangeError ? <Text accessibilityRole="alert" style={styles.error}>{history.rangeError}</Text> : null}
      {receiptError ? <Text accessibilityRole="alert" style={styles.error}>{receiptError}</Text> : null}
      {history.loading ? <ActivityIndicator color="#168f78" style={styles.loading} /> : history.error ? <View><Text accessibilityRole="alert" style={styles.error}>{history.error}</Text><Pressable accessibilityRole="button" onPress={() => void history.load()} style={styles.retry}><Text>Tentar novamente</Text></Pressable></View> : <>
        {!history.rangeError && <HistoryColumns paid={history.paid} received={history.received} onOpen={url => void openReceipt(url)} />}
        {(history.undated.paid.length > 0 || history.undated.received.length > 0) && <View style={styles.undated}><Text style={styles.section}>Sem data registrada</Text><Text style={styles.subtitle}>Fora do filtro e dos totais do período.</Text><HistoryColumns {...history.undated} totals={false} onOpen={url => void openReceipt(url)} /></View>}
      </>}
    </ScrollView>
    {receipt && <ReceiptViewer key={receipt} url={receipt} onClose={() => setReceipt(null)} />}
  </SafeAreaView>;
}
const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: '#fff' }, header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' }, back: { padding: 4, marginRight: 10 }, arrow: { fontSize: 30, lineHeight: 32, color: '#1abc9c' }, brand: { fontSize: 20, fontWeight: '700', color: '#1abc9c' }, content: { padding: 16, paddingBottom: 40, width: '100%', maxWidth: 1000, alignSelf: 'center' }, titleBar: { backgroundColor: '#f3f4f4', paddingVertical: 10, paddingHorizontal: 10, marginBottom: 10 }, title: { fontSize: 21, fontWeight: '700', color: '#292e2b' }, filterPanel: { borderWidth: 1, borderColor: '#e2e6e4', borderRadius: 8, padding: 12, marginBottom: 22, backgroundColor: '#fff' }, filterTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 14 }, subtitle: { color: '#626b67', fontSize: 12, marginBottom: 16 }, filters: { flexDirection: 'row', gap: 10, marginBottom: 8 }, field: { flex: 1, minWidth: 0 }, label: { fontSize: 13, color: '#333', marginBottom: 6 }, input: { backgroundColor: '#f5f6f5', borderWidth: 1, borderColor: '#d4d9d6', borderRadius: 8, padding: 10, fontSize: 14, minHeight: 44, color: '#222' }, error: { color: '#b13529', marginBottom: 16 }, loading: { margin: 24 }, retry: { padding: 14, backgroundColor: '#e4f6f0', borderRadius: 8 }, undated: { marginTop: 24 }, section: { fontSize: 19, fontWeight: '700', color: '#333', marginBottom: 8 } });
