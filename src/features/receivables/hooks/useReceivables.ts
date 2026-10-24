import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import { appAlert as Alert } from '@/components/appAlert';
import { getApiErrorMessage, notificacaoService, pagamentoService } from '@/services/api';
import { session } from '@/services/session';
import type { ReceivablePayment } from '../types';

export function useReceivables() {
  const router = useRouter();
  const [receivables, setReceivables] = useState<ReceivablePayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [sendingChargeId, setSendingChargeId] = useState<string | null>(null);

  const loadReceivables = useCallback(async () => {
    const user = session.getUser();
    const residencia = session.getResidencia();

    if (!user || !residencia) {
      setReceivables([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const pagamentos = await pagamentoService.list({
        residenciaId: residencia.id,
        status: 'PENDENTE',
      });

      setReceivables(
        (pagamentos as ReceivablePayment[]).filter(
          pagamento => pagamento.usuarioId !== user.id && pagamento.despesa?.criadoPorId === user.id,
        ),
      );
    } catch (error: any) {
      Alert.alert(
        'Erro ao carregar recebiveis',
        getApiErrorMessage(error, 'Nao foi possivel carregar quem te deve.'),
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadReceivables();
    }, [loadReceivables]),
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadReceivables();
  };

  const handleMarkPaid = (payment: ReceivablePayment) => {
    if (updatingId) return;
    const debtorName = payment.usuario?.nome ?? 'morador';
    const message = `Marcar pagamento de ${debtorName} como recebido?`;
    const markReceived = async () => {
      setUpdatingId(payment.id);
      try {
        await pagamentoService.update(payment.id, {
          status: 'CONFIRMADO',
          pagoEm: new Date().toISOString(),
        });
        await loadReceivables();
        if (Platform.OS === 'web') window.alert('Pagamento marcado como recebido.');
        else Alert.alert('Pronto', 'Pagamento marcado como recebido.');
      } catch (error: any) {
        const errorMessage = getApiErrorMessage(error, 'Nao foi possivel marcar como recebido.');
        if (Platform.OS === 'web') window.alert(errorMessage);
        else Alert.alert('Erro ao atualizar', errorMessage);
      } finally {
        setUpdatingId(null);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(message)) void markReceived();
    } else {
      Alert.alert('Confirmar', message, [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Confirmar', onPress: markReceived },
      ]);
    }
  };

  const handleSendCharge = (payment: ReceivablePayment) => {
    if (sendingChargeId || updatingId) return;
    const send = async () => {
      setSendingChargeId(payment.id);
      try {
        await notificacaoService.enviarCobranca(payment.id);
        const message = 'Envio aceito pelo servico de e-mail. Isso nao confirma a entrega na caixa de entrada.';
        if (Platform.OS === 'web') window.alert(message);
        else Alert.alert('Cobranca solicitada', message);
      } catch (error: any) {
        const message = getApiErrorMessage(error, 'Nao foi possivel enviar a cobranca por e-mail.');
        if (Platform.OS === 'web') window.alert(message);
        else Alert.alert('Erro ao enviar cobranca', message);
      } finally { setSendingChargeId(null); }
    };
    const message = `Enviar lembrete da parcela de R$ ${Number(payment.valor).toFixed(2).replace('.', ',')} para ${payment.usuario?.nome ?? 'o morador'}? Um novo envio so sera permitido apos 24 horas.`;
    if (Platform.OS === 'web') { if (window.confirm(message)) void send(); }
    else Alert.alert('Enviar cobranca', message, [
      { text: 'Cancelar', style: 'cancel' }, { text: 'Enviar', onPress: send },
    ]);
  };

  return {
    router, receivables, loading, refreshing, updatingId, sendingChargeId,
    handleRefresh, handleMarkPaid, handleSendCharge,
  };
}
