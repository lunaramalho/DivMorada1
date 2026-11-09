import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { appAlert } from '@/components/appAlert';
import { getApiErrorMessage } from '@/services/api';
import { paymentRequests, type PaymentRequest } from '@/services/paymentRequests';
import { session } from '@/services/session';

export function useConfirmations() {
  const router = useRouter();
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true); setError('');
    const user = session.getUser();
    const house = session.getResidencia();
    if (!user) { setLoading(false); router.replace('/(auth)/login'); return; }
    if (!house) { setLoading(false); setError('Selecione uma casa para consultar as confirmações.'); return; }
    try { setRequests((await paymentRequests.list(house.id, false)).filter(request => request.credorId === user.id)); }
    catch (err) { setError(getApiErrorMessage(err as Parameters<typeof getApiErrorMessage>[0], 'Não foi possível carregar as confirmações.')); }
    finally { setLoading(false); }
  }, [router]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  const resolve = (request: PaymentRequest, approve: boolean) => {
    if (busy) return;
    const message = approve
      ? request.tipo === 'PAGAMENTO' ? 'Confirme somente se você realmente recebeu este valor. A dívida será quitada.' : 'A dívida original será substituída pelas parcelas e vencimentos apresentados. O total será preservado.'
      : 'A dívida continuará pendente. O devedor poderá enviar uma nova solicitação.';
    appAlert.alert(approve ? request.tipo === 'PAGAMENTO' ? 'Confirmar recebimento?' : 'Aprovar parcelamento?' : 'Recusar solicitação?', message, [
      { text: 'Voltar', style: 'cancel' },
      { text: approve ? 'Confirmar' : 'Recusar', onPress: async () => {
        setBusy(true); setError('');
        try { await paymentRequests.resolve(request.id, approve ? 'APROVADA' : 'RECUSADA'); await load(); }
        catch (err) {
          await load();
          setError(getApiErrorMessage(err as Parameters<typeof getApiErrorMessage>[0], 'Não foi possível analisar a solicitação.'));
        } finally { setBusy(false); }
      } },
    ]);
  };
  return { router, requests, loading, busy, error, load, resolve };
}
