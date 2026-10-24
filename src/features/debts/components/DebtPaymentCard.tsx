import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { DebtPayment } from '../types';

type Props = {
  payment: DebtPayment;
  isUpdating: boolean;
  onPay: (payment: DebtPayment) => void;
  onAttach: (payment: DebtPayment) => void;
};

const avatarColors = ['#c0392b', '#2980b9', '#1abc9c', '#8e44ad', '#d35400', '#16a085'];

const formatCurrency = (value: string | number) =>
  Number(value).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

const getAvatarColor = (id: string) => {
  const sum = id.split('').reduce((total, char) => total + char.charCodeAt(0), 0);
  return avatarColors[sum % avatarColors.length];
};

export function DebtPaymentCard({ payment, isUpdating, onPay, onAttach }: Props) {
  const creditorName = payment.despesa?.criadoPor?.nome ?? 'Morador';
  const category = payment.despesa?.nome ?? 'Despesa';

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={[styles.avatar, { backgroundColor: getAvatarColor(creditorName) }]}>
          <Text style={styles.avatarText}>{creditorName.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{creditorName}</Text>
          <Text style={styles.category}>{category}</Text>
        </View>
        <Text style={styles.amount}>{formatCurrency(payment.valor)}</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.btnPay, isUpdating && styles.btnDisabled]}
          onPress={() => onPay(payment)}
          disabled={isUpdating}
        >
          <Text style={styles.btnPayText}>{isUpdating ? 'Salvando...' : 'Pagar Agora'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btnAttach, isUpdating && styles.btnDisabled]}
          onPress={() => onAttach(payment)}
          disabled={isUpdating}
        >
          <Text style={styles.btnAttachText}>Anexar Comprovante</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700', color: '#222' },
  category: { fontSize: 12, color: '#888', marginTop: 2 },
  amount: { fontSize: 16, fontWeight: 'bold', color: '#222' },

  actions: { flexDirection: 'row', gap: 10 },
  btnPay: {
    backgroundColor: '#1abc9c',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  btnPayText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  btnAttach: {
    borderWidth: 1,
    borderColor: '#ccc',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  btnAttachText: { color: '#555', fontSize: 13 },
  btnDisabled: { opacity: 0.6 },
});
