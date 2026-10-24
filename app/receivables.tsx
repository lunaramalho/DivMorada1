import { SafeAreaView } from 'react-native-safe-area-context';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ReceivablePaymentCard } from '@/features/receivables/components/ReceivablePaymentCard';
import { ReceivablesStatus } from '@/features/receivables/components/ReceivablesStatus';
import { useReceivables } from '@/features/receivables/hooks/useReceivables';

export default function ReceivablesScreen() {
  const {
    router, receivables, loading, refreshing, updatingId, sendingChargeId,
    handleRefresh, handleMarkPaid, handleSendCharge,
  } = useReceivables();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={styles.backBtn}>
          <Text style={styles.backArrow}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}><Text style={styles.brand}>DivMorada</Text></Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>Recebiveis</Text>

        {loading || receivables.length === 0 ? (
          <ReceivablesStatus loading={loading} />
        ) : (
          receivables.map(item => (
            <ReceivablePaymentCard
              key={item.id}
              item={item}
              isUpdating={updatingId === item.id}
              isSendingCharge={sendingChargeId === item.id}
              onMarkPaid={handleMarkPaid}
              onSendCharge={handleSendCharge}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f4f6f5' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  backBtn: { marginRight: 10, padding: 4 },
  backArrow: { fontSize: 24, color: '#1abc9c', lineHeight: 28 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  brand: { color: '#1abc9c' },

  content: { padding: 16, paddingBottom: 32 },
  pageTitle: { fontSize: 20, fontWeight: '700', color: '#1abc9c', marginBottom: 18 },
});
