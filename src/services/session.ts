export type SessionUser = {
  id: string;
  nome: string;
  email: string;
  fotoUrl?: string | null;
};

export type SessionResidencia = {
  id: string;
  nome: string;
  descricao?: string | null;
  codigo: string;
};

let token: string | null = null;
let user: SessionUser | null = null;
let residencia: SessionResidencia | null = null;

export const session = {
  setAuth(nextToken: string, nextUser: SessionUser) {
    token = nextToken;
    user = nextUser;
  },
  getToken() {
    return token;
  },
  getUser() {
    return user;
  },
  setResidencia(nextResidencia: SessionResidencia | null) {
    residencia = nextResidencia;
  },
  getResidencia() {
    return residencia;
  },
  clear() {
    token = null;
    user = null;
    residencia = null;
  },
};
