import type { Pagamento } from '@/services/api';

export type ReceivablePayment = Pagamento & {
  despesa?: {
    id: string;
    nome: string;
    descricao?: string | null;
    criadoPorId: string;
  } | null;
  usuario?: {
    id: string;
    nome: string;
    email: string;
  };
};
