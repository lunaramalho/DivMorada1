import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { ReceivablePayment } from '../types';

type Props = {
  item: ReceivablePayment;
  isUpdating: boolean;
  isSendingCharge: boolean;
  onMarkPaid: (payment: ReceivablePayment) => void;
  onSendCharge: (payment: ReceivablePayment) => void;
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

export function ReceivablePaymentCard({ item, isUpdating, isSendingCharge, onMarkPaid, onSendCharge }: Props) {
  const debtorName = item.usuario?.nome ?? 'Morador';
  const category = item.despesa?.nome ?? 'Despesa';

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={[styles.avatar, { backgroundColor: getAvatarColor(debtorName) }]}>
          <Text style={styles.avatarText}>{debtorName.charAt(0).toUpperCase()}</Text>
        </View>

        <View style={styles.info}>
          <Text style={styles.name}>{debtorName}</Text>
          <Text style={styles.category}>{category}</Text>
        </View>

        <Text style={styles.amount}>{formatCurrency(item.valor)}</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.btnMark, isUpdating && styles.btnDisabled]}
          onPress={() => onMarkPaid(item)}
          disabled={isUpdating}
        >
          <Text style={styles.btnMarkText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
            {isUpdating ? 'Salvando...' : 'Marcar como Pago'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.btnCharge, (isUpdating || isSendingCharge) && styles.btnDisabled]}
          onPress={() => onSendCharge(item)}
          disabled={isUpdating || isSendingCharge}
        >
          <Text style={styles.btnChargeText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
            {isSendingCharge ? 'Enviando...' : 'Enviar Cobranca'}
          </Text>
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
  info: { flex: 1, paddingRight: 8 },
  name: { fontSize: 15, fontWeight: '700', color: '#222' },
  category: { fontSize: 12, color: '#888', marginTop: 2 },
  amount: { fontSize: 16, fontWeight: 'bold', color: '#222' },

  actions: { flexDirection: 'row', gap: 8 },
  actionButton: {
    flex: 1,
    minWidth: 0,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  btnMark: { backgroundColor: '#1abc9c' },
  btnMarkText: { color: '#fff', fontWeight: '700', fontSize: 12, textAlign: 'center', maxWidth: '100%' },
  btnCharge: { backgroundColor: '#2980b9' },
  btnChargeText: { color: '#fff', fontWeight: '700', fontSize: 12, textAlign: 'center', maxWidth: '100%' },
  btnDisabled: { opacity: 0.6 },
});
