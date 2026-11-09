import { supabase } from './supabase';
import { getApiErrorMessage, type Pagamento } from './api';

export type PaymentRequest = {
  id: string;
  pagamentoId: string;
  residenciaId: string;
  devedorId: string;
  credorId: string;
  tipo: 'PAGAMENTO' | 'PARCELAMENTO';
  status: 'PENDENTE' | 'APROVADA' | 'RECUSADA' | 'CANCELADA' | 'ENCERRADA';
  valor: string | number;
  quantidade: number | null;
  primeiroVencimento: string | null;
  comprovanteUrl: string | null;
  createdAt: string;
  resolvedAt: string | null;
  pagamento?: Pagamento;
  devedor?: { nome: string };
  credor?: { nome: string };
};

const fail = (error: Parameters<typeof getApiErrorMessage>[0]): never => {
  throw new Error(getApiErrorMessage(error, 'Não foi possível atualizar a solicitação.'));
};

export const paymentRequests = {
  async list(residenciaId: string, pendingOnly = true) {
    let query = supabase.from('payment_requests').select(`*,
      pagamento:pagamentos!payment_requests_pagamentoId_fkey(*, despesa:despesas(nome)),
      devedor:usuarios!payment_requests_devedorId_fkey(nome),
      credor:usuarios!payment_requests_credorId_fkey(nome)
    `).eq('residenciaId', residenciaId).order('createdAt', { ascending: false });
    if (pendingOnly) query = query.eq('status', 'PENDENTE');
    const { data, error } = await query;
    if (error) fail(error);
    return (data ?? []) as unknown as PaymentRequest[];
  },
  async create(paymentId: string, type: PaymentRequest['tipo'], options?: { count?: number; first?: string; receipt?: string }) {
    const { data, error } = await supabase.rpc('create_payment_request', {
      p_payment: paymentId, p_type: type,
      p_count: options?.count ?? null, p_first: options?.first ?? null, p_receipt: options?.receipt ?? null,
    });
    if (error) fail(error);
    return data as PaymentRequest;
  },
  async resolve(id: string, action: 'APROVADA' | 'RECUSADA' | 'CANCELADA') {
    const { data, error } = await supabase.rpc('resolve_payment_request', { p_request: id, p_action: action });
    if (error) fail(error);
    return data as PaymentRequest;
  },
};
