import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { getApiErrorMessage, pagamentoService, type Pagamento } from '@/services/api';
import { session } from '@/services/session';
import { formatDateInput, parseDateInput, paymentTime } from '../dateRange';

export function usePaymentHistory() {
  const router = useRouter();
  const [start, setStart] = useState(() => { const now = new Date(); return formatDateInput(new Date(now.getFullYear(), now.getMonth(), 1)); });
  const [end, setEnd] = useState(() => { const now = new Date(); return formatDateInput(new Date(now.getFullYear(), now.getMonth() + 1, 0)); });
  const [records, setRecords] = useState<Pagamento[]>([]);
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    const user = session.getUser();
    const house = session.getResidencia();
    setRecords([]); setError(''); setLoading(true);
    if (!user) { setLoading(false); router.replace('/(auth)/login'); return; }
    setUserId(user.id);
    if (!house) { setError('Selecione uma casa para consultar o histórico.'); setLoading(false); return; }
    try {
      const payments = await pagamentoService.list({ residenciaId: house.id, status: 'CONFIRMADO' });
      setRecords(payments.filter(p => p.usuarioId === user.id || p.despesa?.criadoPorId === user.id)
        .sort((a, b) => (paymentTime(b.pagoEm) ?? 0) - (paymentTime(a.pagoEm) ?? 0)));
    } catch (err) { setError(getApiErrorMessage(err as Parameters<typeof getApiErrorMessage>[0], 'Não foi possível carregar o histórico.')); }
    finally { setLoading(false); }
  }, [router]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  const result = useMemo(() => {
    const from = parseDateInput(start), to = parseDateInput(end);
    const rangeError = !from || !to ? 'Informe datas válidas no formato DD/MM/AAAA.' : from > to ? 'A data final deve ser igual ou posterior à inicial.' : '';
    if (to) to.setDate(to.getDate() + 1);
    const dated = rangeError ? [] : records.filter(p => { const time = paymentTime(p.pagoEm); return time !== null && time >= from!.getTime() && time < to!.getTime(); });
    const undated = records.filter(p => paymentTime(p.pagoEm) === null);
    const split = (items: Pagamento[]) => ({ paid: items.filter(p => p.usuarioId === userId), received: items.filter(p => p.usuarioId !== userId && p.despesa?.criadoPorId === userId) });
    return { ...split(dated), undated: split(undated), rangeError };
  }, [start, end, records, userId]);
  return { router, start, end, setStart, setEnd, loading, error, load, ...result };
}
