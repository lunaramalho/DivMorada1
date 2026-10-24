import { StyleSheet, Text, TextInput, View } from 'react-native';

type Props = {
  expenseName: string;
  totalValue: string;
  onChangeExpenseName: (value: string) => void;
  onChangeTotalValue: (value: string) => void;
};

export function ExpenseDetailsForm({ expenseName, totalValue, onChangeExpenseName, onChangeTotalValue }: Props) {
  return (
    <>
      <Text style={styles.cardTitle}>Nova Despesa</Text>

      <Text style={styles.fieldLabel}>Detalhes Basicos</Text>
      <Text style={styles.subLabel}>Nome da Despesa:</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="ex: Internet"
          placeholderTextColor="#bbb"
          value={expenseName}
          onChangeText={onChangeExpenseName}
        />
      </View>

      <Text style={styles.subLabel}>Valor total (R$):</Text>
      <View style={styles.valueRow}>
        <Text style={styles.currencyLabel}>R$</Text>
        <TextInput
          style={styles.valueInput}
          placeholder="0,00"
          placeholderTextColor="#bbb"
          keyboardType="numeric"
          value={totalValue}
          onChangeText={onChangeTotalValue}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  cardTitle: { fontSize: 20, fontWeight: 'bold', color: '#222', marginBottom: 14 },
  fieldLabel: { fontSize: 15, fontWeight: '700', color: '#333', marginBottom: 10 },
  subLabel: { fontSize: 13, color: '#555', marginBottom: 6, fontWeight: '600' },

  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#ddd', borderRadius: 10,
    paddingHorizontal: 12, marginBottom: 14, backgroundColor: '#fafafa',
  },
  input: { flex: 1, height: 44, fontSize: 14, color: '#333' },

  valueRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#1abc9c', borderRadius: 10,
    paddingHorizontal: 14, height: 52, backgroundColor: '#fafafa',
  },
  currencyLabel: { fontSize: 16, fontWeight: '700', color: '#1abc9c', marginRight: 8 },
  valueInput: { flex: 1, fontSize: 22, fontWeight: 'bold', color: '#222' },

});
