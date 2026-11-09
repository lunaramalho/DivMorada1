import * as DocumentPicker from 'expo-document-picker';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import { appAlert as Alert } from '@/components/appAlert';
import { getApiErrorMessage, pagamentoService, uploadService } from '@/services/api';
import { session } from '@/services/session';
import type { DebtPayment } from '../types';
import { paymentRequests, type PaymentRequest } from '@/services/paymentRequests';

export function useDebts() {
  const router = useRouter();
  const [debts, setDebts] = useState<DebtPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [loadError, setLoadError] = useState('');
  const [installmentPayment, setInstallmentPayment] = useState<DebtPayment | null>(null);

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
      setLoadError('');
      const [pagamentos, requestData] = await Promise.all([pagamentoService.list({
        residenciaId: residencia.id,
        usuarioId: user.id,
        status: 'PENDENTE',
      }), paymentRequests.list(residencia.id, false)]);
      setRequests(requestData.filter(request => request.devedorId === user.id));

      setDebts(
        (pagamentos as DebtPayment[]).filter(
          pagamento => pagamento.despesa?.criadoPorId && pagamento.despesa.criadoPorId !== user.id,
        ),
      );
    } catch (error: any) {
      setLoadError(getApiErrorMessage(error, 'Não foi possível carregar suas dívidas.'));
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
      await paymentRequests.create(payment.id, 'PAGAMENTO', { receipt: upload?.url });
      setSelectedPayment(null);
      setReceipts(previous => {
        const next = { ...previous };
        delete next[payment.id];
        return next;
      });
      await loadDebts();
      if (Platform.OS === 'web') window.alert('Pagamento informado. Aguardando confirmação do credor.');
      else Alert.alert('Pronto', 'Pagamento informado. Aguardando confirmação do credor.');
    } catch (error: any) {
      setPaymentError(getApiErrorMessage(error, 'Não foi possível informar o pagamento. Tente novamente.'));
    } finally {
      setUpdatingId(null);
    }
  };

  const submitInstallment = async (count: number, first: string) => {
    if (!installmentPayment || updatingId) return;
    setUpdatingId(installmentPayment.id);
    try {
      await paymentRequests.create(installmentPayment.id, 'PARCELAMENTO', { count, first });
      setInstallmentPayment(null);
      await loadDebts();
      Alert.alert('Solicitação enviada', 'O credor poderá analisar as parcelas em Confirmações.');
    } finally { setUpdatingId(null); }
  };

  const cancelRequest = (request: PaymentRequest) => {
    if (updatingId) return;
    Alert.alert('Cancelar solicitação?', 'A dívida continuará no saldo e ficará disponível para um novo registro.', [
      { text: 'Voltar', style: 'cancel' },
      { text: 'Cancelar solicitação', onPress: async () => {
        setUpdatingId(request.pagamentoId);
        try { await paymentRequests.resolve(request.id, 'CANCELADA'); await loadDebts(); }
        catch (error: any) { Alert.alert('Não foi possível cancelar', getApiErrorMessage(error, 'Atualize a página e tente novamente.')); }
        finally { setUpdatingId(null); }
      } },
    ]);
  };

  return {
    router, debts, loading, refreshing, updatingId, handleRefresh, confirmPayment, handleAttach,
    selectedPayment, receipts, paymentError, removeReceipt, closePayment, handleConfirmPayment,
    requests, loadError, installmentPayment, setInstallmentPayment, submitInstallment, cancelRequest,
  };
}
