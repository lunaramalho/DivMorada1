import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ExpenseDetailsForm } from '@/features/expenses/components/ExpenseDetailsForm';
import { ResidentSelector } from '@/features/expenses/components/ResidentSelector';
import { ExpenseSplitSummary } from '@/features/expenses/components/ExpenseSplitSummary';
import { useAddExpense } from '@/features/expenses/hooks/useAddExpense';

export default function AddExpenseScreen() {
  const {
    people, expenseName, totalValue, payerId, participants, loading,
    valuePerPerson, setExpenseName, setPayerId, toggleParticipant,
    handleCancel, handleSave, handleChangeTotalValue,
  } = useAddExpense();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} style={styles.backBtn}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.logo}><Text style={styles.brand}>DivMorada</Text></Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <ExpenseDetailsForm
            expenseName={expenseName}
            totalValue={totalValue}
            onChangeExpenseName={setExpenseName}
            onChangeTotalValue={handleChangeTotalValue}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Quem Participa e Como Divide</Text>
          <Text style={styles.subLabel}>Quem Pagou? (Selecione um)</Text>
          <ResidentSelector
            people={people}
            selectedIds={payerId ? [payerId] : []}
            onSelect={setPayerId}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.subLabel}>Quem Participa? (Selecione todos)</Text>
          <ResidentSelector
            people={people}
            selectedIds={participants}
            onSelect={toggleParticipant}
          />

          <ExpenseSplitSummary
            people={people}
            participants={participants}
            valuePerPerson={valuePerPerson}
          />
        </View>

        <View style={styles.btnRow}>
          <TouchableOpacity style={styles.btnCancel} onPress={handleCancel}>
            <Text style={styles.btnCancelText}>Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btnSave, loading && styles.btnSaveDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={styles.btnSaveText}>{loading ? 'Salvando...' : 'Salvar Despesa'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f4f6f5' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10,
    backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee',
  },
  backBtn: { marginRight: 10, padding: 4 },
  backArrow: { fontSize: 30, color: '#1abc9c', lineHeight: 32 },
  logo: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  brand: { color: '#1abc9c' },

  content: { padding: 16, paddingBottom: 40 },

  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    marginBottom: 16, elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07, shadowRadius: 4,
  },
  fieldLabel: { fontSize: 15, fontWeight: '700', color: '#333', marginBottom: 10 },
  subLabel: { fontSize: 13, color: '#555', marginBottom: 6, fontWeight: '600' },

  btnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },

  btnCancel: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#1abc9c',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  btnCancelText: {
    color: '#1abc9c',
    fontWeight: 'bold',
    fontSize: 16,
  },

  btnSave: {
    flex: 1,
    backgroundColor: '#1abc9c',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
  },
  btnSaveDisabled: { opacity: 0.7 },
  btnSaveText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
