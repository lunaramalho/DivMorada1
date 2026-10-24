import type { Pagamento } from '@/services/api';

export type DebtPayment = Pagamento & {
  despesa?: {
    id: string;
    nome: string;
    descricao?: string | null;
    criadoPorId: string;
    criadoPor?: {
      id: string;
      nome: string;
      email: string;
    };
  } | null;
};
