import { useRef, useState } from 'react';
import type { ComponentRef } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import type { PaymentRequest } from '@/services/paymentRequests';
import { displayDate } from '../installments';
import type { DebtPayment } from '../types';

type Props = {
  payment: DebtPayment;
  isUpdating: boolean;
  onPay: (payment: DebtPayment) => void;
  onAttach: (payment: DebtPayment) => void;
  request?: PaymentRequest;
  menuOpen: boolean;
  onMenu: (id: string | null) => void;
  onInstallment: (payment: DebtPayment) => void;
  onCancel: (request: PaymentRequest) => void;
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

export function DebtPaymentCard({ payment, isUpdating, onPay, onAttach, request, menuOpen, onMenu, onInstallment, onCancel }: Props) {
  const creditorName = payment.despesa?.criadoPor?.nome ?? 'Morador';
  const category = payment.despesa?.nome ?? 'Despesa';
  const pending = request?.status === 'PENDENTE';
  const disabled = isUpdating || pending;
  const canInstallment = payment.status === 'PENDENTE' && !payment.pagamentoOriginalId && !pending && Number(payment.valor) >= 0.02;
  const anchor = useRef<ComponentRef<typeof View>>(null);
  const [position, setPosition] = useState({ x: 16, y: 100 });
  const { width, height } = useWindowDimensions();
  const menuWidth = Math.min(240, width - 32);
  const openMenu = () => anchor.current?.measureInWindow((x, y, w, h) => {
    setPosition({ x: Math.max(16, Math.min(x + w - menuWidth, width - menuWidth - 16)), y: Math.max(16, Math.min(y + h + 4, height - 80)) });
    onMenu(payment.id);
  });

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
        {canInstallment && <View ref={anchor} collapsable={false}>
          <Pressable accessibilityRole="button" accessibilityLabel={`Opções da dívida ${category} com ${creditorName}`} accessibilityState={{ expanded: menuOpen }} disabled={isUpdating} onPress={openMenu} style={styles.menuTrigger}>
            <MaterialCommunityIcons name="dots-vertical" size={22} color="#68716d" />
          </Pressable>
        </View>}
      </View>

      {payment.numeroParcela != null && <Text style={styles.parcel}>Parcela {payment.numeroParcela}/{payment.totalParcelas} · Vencimento: {payment.vencimento ? displayDate(payment.vencimento) : '—'}</Text>}
      {pending && <View style={styles.pending}>
        <Text style={styles.pendingText}>{request.tipo === 'PAGAMENTO' ? 'Pagamento informado · Aguardando confirmação' : 'Parcelamento · Aguardando análise'}</Text>
        <Pressable accessibilityRole="button" disabled={isUpdating} onPress={() => onCancel(request)} style={styles.cancel}><Text style={styles.cancelText}>{isUpdating ? 'Aguarde...' : 'Cancelar solicitação'}</Text></Pressable>
      </View>}
      {request?.status === 'RECUSADA' && <Text style={styles.feedback}>{request.tipo === 'PAGAMENTO' ? 'Pagamento recusado. Você pode informar novamente, com ou sem comprovante.' : 'Parcelamento recusado. Você pode enviar uma nova proposta.'}</Text>}

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.btnPay, disabled && styles.btnDisabled]}
          onPress={() => onPay(payment)}
          disabled={disabled}
        >
          <Text style={styles.btnPayText}>{isUpdating ? 'Salvando...' : 'Pagar Agora'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btnAttach, disabled && styles.btnDisabled]}
          onPress={() => onAttach(payment)}
          disabled={disabled}
        >
          <Text style={styles.btnAttachText}>Anexar Comprovante</Text>
        </TouchableOpacity>
      </View>
      {menuOpen && canInstallment && <Modal transparent visible animationType="fade" onRequestClose={() => onMenu(null)}>
        <View style={styles.menuBackdrop}>
          <Pressable accessibilityRole="button" accessibilityLabel="Fechar menu de opções" onPress={() => onMenu(null)} style={StyleSheet.absoluteFill} />
          <View style={[styles.dropdown, { left: position.x, top: position.y, width: menuWidth }]}>
            <Pressable accessibilityRole="button" onPress={() => { onMenu(null); onInstallment(payment); }} style={styles.menuOption}>
              <Text style={styles.menuText}>Solicitar parcelamento</Text>
            </Pressable>
          </View>
        </View>
      </Modal>}
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
  info: { flex: 1, minWidth: 0, paddingRight: 8 },
  name: { fontSize: 15, fontWeight: '700', color: '#222' },
  category: { fontSize: 12, color: '#888', marginTop: 2 },
  amount: { fontSize: 16, fontWeight: 'bold', color: '#222' },

  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  menuTrigger: { minWidth: 36, minHeight: 44, alignItems: 'center', justifyContent: 'center', marginLeft: 4 },
  menuBackdrop: { flex: 1 }, dropdown: { position: 'absolute', backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#e2e6e4', elevation: 8, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
  menuOption: { padding: 16, minHeight: 48 }, menuText: { color: '#333', fontSize: 14 },
  parcel: { color: '#68716d', fontSize: 12, marginBottom: 12 },
  pending: { padding: 12, backgroundColor: '#fff8e5', borderRadius: 8, marginBottom: 12 }, pendingText: { color: '#805c17', fontSize: 13 },
  cancel: { alignSelf: 'flex-start', paddingVertical: 12 }, cancelText: { color: '#805c17', fontWeight: '600', textDecorationLine: 'underline' },
  feedback: { color: '#b33229', fontSize: 13, marginBottom: 12 },
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
