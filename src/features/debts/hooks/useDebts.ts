import * as DocumentPicker from 'expo-document-picker';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import { appAlert as Alert } from '@/components/appAlert';
import { getApiErrorMessage, pagamentoService, uploadService } from '@/services/api';
import { session } from '@/services/session';
import type { DebtPayment } from '../types';

export function useDebts() {
  const router = useRouter();
  const [debts, setDebts] = useState<DebtPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [selectedPayment, setSelectedPayment] = useState<DebtPayment | null>(null);
  const [receipts, setReceipts] = useState<Record<string, DocumentPicker.DocumentPickerAsset>>({});
  const [paymentError, setPaymentError] = useState('');

  const loadDebts = useCallback(async () => {
    const user = session.getUser();
    const residencia = session.getResidencia();

    if (!user || !residencia) {
      setDebts([]);
      setLoading(false);
      return;
    }

    try {
      const pagamentos = await pagamentoService.list({
        residenciaId: residencia.id,
        usuarioId: user.id,
        status: 'PENDENTE',
      });

      setDebts(
        (pagamentos as DebtPayment[]).filter(
          pagamento => pagamento.despesa?.criadoPorId && pagamento.despesa.criadoPorId !== user.id,
        ),
      );
    } catch (error: any) {
      Alert.alert(
        'Erro ao carregar dividas',
        getApiErrorMessage(error, 'Nao foi possivel carregar suas dividas.'),
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadDebts();
    }, [loadDebts]),
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadDebts();
  };

  const confirmPayment = (payment: DebtPayment) => {
    setPaymentError('');
    setSelectedPayment(payment);
  };

  const handleAttach = async (payment: DebtPayment) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'], copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      setReceipts(previous => ({ ...previous, [payment.id]: result.assets[0] }));
      setPaymentError('');
      setSelectedPayment(payment);
    } catch (error: any) {
      setPaymentError(getApiErrorMessage(error, 'Nao foi possivel selecionar o comprovante.'));
      setSelectedPayment(payment);
    }
  };

  const removeReceipt = () => {
    if (!selectedPayment) return;
    setReceipts(previous => {
      const next = { ...previous };
      delete next[selectedPayment.id];
      return next;
    });
  };

  const closePayment = () => {
    if (!updatingId) setSelectedPayment(null);
  };

  const handleConfirmPayment = async () => {
    if (!selectedPayment || updatingId) return;
    const payment = selectedPayment;
    const file = receipts[payment.id];
    setUpdatingId(payment.id);
    setPaymentError('');
    try {
      const upload = file ? await uploadService.comprovante({
        uri: file.uri, name: file.name, mimeType: file.mimeType,
      }) : undefined;
      await pagamentoService.update(payment.id, {
        status: 'CONFIRMADO',
        ...(upload ? { comprovanteUrl: upload.url } : {}),
        pagoEm: new Date().toISOString(),
      });
      setSelectedPayment(null);
      setReceipts(previous => {
        const next = { ...previous };
        delete next[payment.id];
        return next;
      });
      await loadDebts();
      if (Platform.OS === 'web') window.alert('Pagamento marcado como confirmado.');
      else Alert.alert('Pronto', 'Pagamento marcado como confirmado.');
    } catch (error: any) {
      setPaymentError(getApiErrorMessage(error, 'Nao foi possivel confirmar o pagamento. Tente novamente.'));
    } finally {
      setUpdatingId(null);
    }
  };

  return {
    router, debts, loading, refreshing, updatingId, handleRefresh, confirmPayment, handleAttach,
    selectedPayment, receipts, paymentError, removeReceipt, closePayment, handleConfirmPayment,
  };
}
