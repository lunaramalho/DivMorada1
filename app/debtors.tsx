import { SafeAreaView } from 'react-native-safe-area-context';
import { PaymentReview } from '@/features/debts/components/PaymentReview';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { DebtPaymentCard } from '@/features/debts/components/DebtPaymentCard';
import { DebtsStatus } from '@/features/debts/components/DebtsStatus';
import { useDebts } from '@/features/debts/hooks/useDebts';
import { useState } from 'react';
import { InstallmentReview } from '@/features/debts/components/InstallmentReview';

export default function DebtorsScreen() {
  const {
    router, debts, loading, refreshing, updatingId,
    handleRefresh, confirmPayment, handleAttach,
    selectedPayment, receipts, paymentError, removeReceipt, closePayment, handleConfirmPayment,
    requests, loadError, installmentPayment, setInstallmentPayment, submitInstallment, cancelRequest,
  } = useDebts();
  const [menuId, setMenuId] = useState<string | null>(null);

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
        <Text style={styles.pageTitle}>Dívidas a Pagar</Text>

        {loadError ? <View><Text accessibilityRole="alert" style={styles.error}>{loadError}</Text><TouchableOpacity onPress={handleRefresh} style={styles.retry}><Text>Tentar novamente</Text></TouchableOpacity></View> : loading || debts.length === 0 ? (
          <DebtsStatus loading={loading} />
        ) : (
          debts.map(payment => (
            <DebtPaymentCard
              key={payment.id}
              payment={payment}
              isUpdating={!!updatingId}
              onPay={confirmPayment}
              onAttach={handleAttach}
              request={requests.find(request => request.pagamentoId === payment.id)}
              menuOpen={menuId === payment.id}
              onMenu={setMenuId}
              onInstallment={setInstallmentPayment}
              onCancel={cancelRequest}
            />
          ))
        )}
      </ScrollView>
      {installmentPayment && <InstallmentReview key={installmentPayment.id} payment={installmentPayment} busy={!!updatingId} onClose={() => { if (!updatingId) setInstallmentPayment(null); }} onSubmit={submitInstallment} />}
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
  error: { color: '#b33229', marginBottom: 12 }, retry: { padding: 16, backgroundColor: '#fff', borderRadius: 8, alignItems: 'center' },
});
