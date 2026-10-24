import { SafeAreaView } from 'react-native-safe-area-context';
import { PaymentReview } from '@/features/debts/components/PaymentReview';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { DebtPaymentCard } from '@/features/debts/components/DebtPaymentCard';
import { DebtsStatus } from '@/features/debts/components/DebtsStatus';
import { useDebts } from '@/features/debts/hooks/useDebts';

export default function DebtorsScreen() {
  const {
    router, debts, loading, refreshing, updatingId,
    handleRefresh, confirmPayment, handleAttach,
    selectedPayment, receipts, paymentError, removeReceipt, closePayment, handleConfirmPayment,
  } = useDebts();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={styles.backBtn}>
          <Text style={styles.backArrow}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.logo}><Text style={styles.brand}>DivMorada</Text></Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>Dividas a Pagar</Text>

        {loading || debts.length === 0 ? (
          <DebtsStatus loading={loading} />
        ) : (
          debts.map(payment => (
            <DebtPaymentCard
              key={payment.id}
              payment={payment}
              isUpdating={updatingId === payment.id}
              onPay={confirmPayment}
              onAttach={handleAttach}
            />
          ))
        )}
      </ScrollView>
      {selectedPayment && (
        <PaymentReview
          key={selectedPayment.id}
          payment={selectedPayment}
          receipt={receipts[selectedPayment.id]}
          busy={updatingId === selectedPayment.id}
          error={paymentError}
          onClose={closePayment}
          onAttach={() => handleAttach(selectedPayment)}
          onRemove={removeReceipt}
          onConfirm={handleConfirmPayment}
        />
      )}
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
    paddingBottom: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  backBtn: { marginRight: 10, padding: 4 },
  backArrow: { fontSize: 24, color: '#1abc9c', lineHeight: 28 },
  logo: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  brand: { color: '#1abc9c' },

  content: { padding: 16, paddingBottom: 32 },
  pageTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 18 },
});
