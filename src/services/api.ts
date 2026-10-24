import { decode } from 'base64-arraybuffer';
import { supabase } from './supabase';
import { session, type SessionResidencia, type SessionUser } from './session';

export const API_BASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'Supabase';

export const api = supabase;

type SupabaseErrorLike = {
  message?: string;
  error_description?: string;
  details?: string;
  hint?: string;
  code?: string;
  response?: {
    data?: {
      message?: string;
    };
  };
};

function throwMessage(message: string): never {
  throw { response: { data: { message } }, message };
}

const getErrorMessage = (error: unknown, fallback: string) => {
  if (!error) {
    return fallback;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error) {
    return error.message || fallback;
  }

  if (typeof error === 'object') {
    const candidate = error as SupabaseErrorLike;

    return (
      candidate.response?.data?.message ||
      candidate.message ||
      candidate.error_description ||
      candidate.details ||
      candidate.hint ||
      (candidate.code ? `${fallback} Codigo: ${candidate.code}.` : fallback)
    );
  }

  return fallback;
};

const assertData = <T>(data: T | null, message: string): T => {
  if (!data) {
    throwMessage(message);
  }

  return data as T;
};

function normalizeError(error: unknown, fallback: string): never {
  throwMessage(getErrorMessage(error, fallback));
}

const toUsuario = (item: any): Usuario => ({
  id: item.id,
  nome: item.nome,
  email: item.email,
  fotoUrl: item.fotoUrl ?? null,
  isActive: item.isActive,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
});

const generateCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

const ensureUsuarioProfile = async (authUser: {
  id: string;
  email?: string;
  user_metadata?: {
    nome?: string;
    fotoUrl?: string | null;
  };
}) => {
  const { data: existingUser, error: findError } = await supabase
    .from('usuarios')
    .select('*')
    .eq('id', authUser.id)
    .maybeSingle();

  if (findError) {
    normalizeError(findError, 'Nao foi possivel carregar o usuario.');
  }

  if (existingUser) {
    return toUsuario(existingUser);
  }

  const email = authUser.email ?? '';
  const nome = authUser.user_metadata?.nome ?? email.split('@')[0] ?? 'Usuario';
  const fotoUrl = authUser.user_metadata?.fotoUrl ?? null;
  const { data: createdUser, error: createError } = await supabase
    .from('usuarios')
    .upsert({
      id: authUser.id,
      nome,
      email,
      fotoUrl,
    }, {
      onConflict: 'id',
    })
    .select('*')
    .single();

  if (createError) {
    normalizeError(createError, 'Nao foi possivel criar o perfil do usuario.');
  }

  return toUsuario(createdUser);
};

const getLatestResidenciaForUser = async (usuarioId: string) => {
  const { data, error } = await supabase
    .from('residencia_usuarios')
    .select('residencia:residencias(*)')
    .eq('usuarioId', usuarioId)
    .eq('ativo', true)
    .order('joinedAt', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    normalizeError(error, 'Nao foi possivel carregar a residencia do usuario.');
  }

  const residencia = Array.isArray(data?.residencia)
    ? data?.residencia[0]
    : data?.residencia;

  return residencia ? (residencia as Residencia) : null;
};

export const getApiErrorMessage = (error: SupabaseErrorLike, fallback: string) => {
  return getErrorMessage(error, fallback);
};

export type Usuario = SessionUser & {
  senha?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type Residencia = SessionResidencia & {
  createdAt?: string;
  updatedAt?: string;
};

export type ResidenciaUsuario = {
  id: string;
  residenciaId: string;
  usuarioId: string;
  role: 'dono' | 'membro';
  ativo: boolean;
  joinedAt: string;
};

export type Despesa = {
  id: string;
  residenciaId: string;
  criadoPorId: string;
  nome: string;
  descricao?: string | null;
  valorTotal: string | number;
  tipo: 'FIXA' | 'VARIAVEL';
  status: 'PENDENTE' | 'PAGA' | 'CANCELADA';
  comprovanteUrl?: string | null;
  vencimento?: string | null;
  pagaEm?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Pagamento = {
  id: string;
  residenciaId: string;
  despesaId?: string | null;
  usuarioId: string;
  valor: string | number;
  status: 'PENDENTE' | 'CONFIRMADO' | 'CANCELADO';
  comprovanteUrl?: string | null;
  observacao?: string | null;
  pagoEm?: string | null;
  createdAt: string;
  despesa?: (Despesa & { criadoPor?: Usuario }) | null;
  usuario?: Usuario;
};

export type ResumoFinanceiro = {
  voceDeve: number;
  teDevem: number;
  saldoLiquido: number;
};

export type Historico = {
  id: string;
  residenciaId: string;
  usuarioId?: string | null;
  acao: string;
  descricao?: string | null;
  createdAt: string;
};

export const authService = {
  async restoreSession() {
    const { data: stored, error: storedError } = await supabase.auth.getSession();
    if (storedError) throw storedError;
    if (!stored.session) { session.clear(); return; }
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      if (error && error.status !== 401 && error.status !== 403) throw error;
      session.clear();
      return;
    }
    const profile = await ensureUsuarioProfile(data.user);
    const house = await getLatestResidenciaForUser(profile.id);
    session.setAuth(stored.session.access_token, profile);
    session.setResidencia(house);
  },
  async login(email: string, senha: string) {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    if (authError) {
      if (authError.code === 'invalid_credentials' || /invalid login credentials/i.test(authError.message)) {
        throwMessage('E-mail ou senha inválidos.');
      }
      throwMessage(authError.message || 'Email ou senha invalidos!');
    }

    const authUser = assertData(authData.user, 'Usuario nao encontrado!');
    let user: Usuario = {
      id: authUser.id,
      nome: authUser.user_metadata?.nome ?? authUser.email?.split('@')[0] ?? 'Usuario',
      email: authUser.email ?? email,
      fotoUrl: authUser.user_metadata?.fotoUrl ?? null,
    };
    let residencia: Residencia | null = null;
    const token = authData.session?.access_token ?? '';

    try {
      user = await ensureUsuarioProfile(authUser);
    } catch (error) {
      console.warn('Nao foi possivel sincronizar perfil do usuario.', getErrorMessage(error, 'Erro desconhecido.'));
    }

    try {
      residencia = await getLatestResidenciaForUser(user.id);
    } catch (error) {
      console.warn('Nao foi possivel carregar residencia no login.', getErrorMessage(error, 'Erro desconhecido.'));
    }

    session.setAuth(token, user);
    session.setResidencia(residencia);

    return {
      message: 'Login realizado com sucesso!',
      token,
      user,
      residencia,
    };
  },

  async register(nome: string, email: string, senha: string, fotoUrl?: string | null, photo?: { base64?: string | null; mimeType?: string | null }) {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        data: {
          nome,
          fotoUrl: null,
        },
      },
    });

    if (authError) {
      const isDuplicate = authError.message.toLowerCase().includes('already');
      throwMessage(isDuplicate ? 'E-mail já cadastrado.' : authError.message);
    }

    assertData(authData.user, 'Nao foi possivel criar o usuario.');

    let photoSaved = !fotoUrl;
    if (fotoUrl && authData.session && authData.user) {
      try {
        const { url } = await uploadService.avatar({ uri: fotoUrl, base64: photo?.base64, mimeType: photo?.mimeType });
        await ensureUsuarioProfile(authData.user);
        await usuarioService.update(authData.user.id, { fotoUrl: url });
        photoSaved = true;
      } catch { /* Account was created; offer a retry in Profile rather than another signup. */ }
    }

    return {
      message: `Usuario ${nome} criado com sucesso!`,
      photoSaved,
    };
  },
};

export const usuarioService = {
  async list() {
    const { data, error } = await supabase.from('usuarios').select('*').order('nome');

    if (error) {
      normalizeError(error, 'Nao foi possivel listar usuarios.');
    }

    return (data ?? []).map(toUsuario);
  },

  async update(
    id: string,
    payload: Partial<Pick<Usuario, 'nome' | 'email' | 'fotoUrl' | 'isActive'>> & { senha?: string; senhaAtual?: string },
  ) {
    const { senha, senhaAtual, ...profilePayload } = payload;

    if (senha) {
      const { error } = await supabase.auth.updateUser({ password: senha, ...(senhaAtual ? { current_password: senhaAtual } : {}) });

      if (error) {
        normalizeError(error, 'Nao foi possivel atualizar a senha.');
      }
    }

    if (Object.keys(profilePayload).length > 0) {
      const { data, error } = await supabase
        .from('usuarios')
        .update(profilePayload)
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        normalizeError(error, 'Nao foi possivel atualizar usuario.');
      }

      return {
        message: `Usuario ${data.nome} atualizado com sucesso!`,
        usuario: toUsuario(data),
      };
    }

    return {
      message: 'Usuario atualizado com sucesso!',
    };
  },
};

export const residenciaService = {
  async list() {
    const { data, error } = await supabase
      .from('residencias')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) {
      normalizeError(error, 'Nao foi possivel listar residencias.');
    }

    return (data ?? []) as Residencia[];
  },

  async joinByCodigo(codigo: string) {
    const { data, error } = await supabase.rpc('join_house_by_code', { p_code: codigo });

    if (error) {
      normalizeError(error, 'Nao foi possivel buscar residencia.');
    }

    return assertData(data as Residencia | null, 'Residencia nao encontrada!');
  },

  async create(nome: string, descricao?: string) {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const codigo = generateCode();
      const { data, error } = await supabase
        .from('residencias')
        .insert({ nome, descricao, codigo })
        .select('*')
        .single();

      if (!error) {
        return {
          message: `Residencia ${data.nome} criada com sucesso!`,
          residencia: data as Residencia,
        };
      }

      if (error.code !== '23505') {
        normalizeError(error, 'Nao foi possivel criar residencia.');
      }
    }

    throwMessage('Nao foi possivel gerar um codigo unico para a residencia.');
  },

  async update(id: string, payload: Partial<Pick<Residencia, 'nome' | 'descricao'>>) {
    const { data, error } = await supabase
      .from('residencias')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      normalizeError(error, 'Nao foi possivel atualizar residencia.');
    }

    return {
      message: `Residencia ${data.nome} atualizada com sucesso!`,
      residencia: data as Residencia,
    };
  },
};

export const residenciaUsuarioService = {
  async list() {
    const { data, error } = await supabase
      .from('residencia_usuarios')
      .select('*')
      .order('joinedAt', { ascending: false });

    if (error) {
      normalizeError(error, 'Nao foi possivel listar moradores.');
    }

    return (data ?? []) as ResidenciaUsuario[];
  },

  async create(residenciaId: string, usuarioId: string, role: 'dono' | 'membro' = 'membro') {
    const { data, error } = await supabase
      .from('residencia_usuarios')
      .insert({
        residenciaId,
        usuarioId,
        role,
        ativo: true,
      })
      .select('*')
      .single();

    if (error) {
      if (error.code === '23505') {
        throwMessage('Usuario ja cadastrado nesta residencia!');
      }

      normalizeError(error, 'Nao foi possivel cadastrar morador.');
    }

    return {
      message: 'Morador cadastrado com sucesso!',
      residenciaUsuario: data as ResidenciaUsuario,
    };
  },

  async update(id: string, payload: Partial<Pick<ResidenciaUsuario, 'role' | 'ativo'>>) {
    const { data, error } = await supabase
      .from('residencia_usuarios')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      normalizeError(error, 'Nao foi possivel atualizar morador.');
    }

    return {
      message: 'Morador atualizado com sucesso!',
      residenciaUsuario: data as ResidenciaUsuario,
    };
  },

  async delete(id: string) {
    const { error } = await supabase.from('residencia_usuarios').delete().eq('id', id);

    if (error) {
      normalizeError(error, 'Nao foi possivel remover morador.');
    }

    return {
      message: 'Morador excluido com sucesso!',
    };
  },
};

export const despesaService = {
  async list() {
    const { data, error } = await supabase
      .from('despesas')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) {
      normalizeError(error, 'Nao foi possivel listar despesas.');
    }

    return (data ?? []) as Despesa[];
  },

  async create(payload: {
    residenciaId: string;
    criadoPorId: string;
    nome: string;
    descricao?: string;
    valorTotal: number;
    tipo: 'FIXA' | 'VARIAVEL';
    status?: 'PENDENTE' | 'PAGA' | 'CANCELADA';
    participantesIds?: string[];
  }) {
    const { participantesIds, ...despesaPayload } = payload;
    const { data: despesa, error } = await supabase
      .from('despesas')
      .insert(despesaPayload)
      .select('*')
      .single();

    if (error) {
      normalizeError(error, 'Nao foi possivel criar despesa.');
    }

    const participantesUnicos = [...new Set(participantesIds ?? [])];
    const devedores = participantesUnicos.filter(usuarioId => usuarioId !== payload.criadoPorId);

    if (devedores.length > 0 && participantesUnicos.length > 0) {
      const totalCentavos = Math.round(Number(payload.valorTotal) * 100);
      const valorPorPessoa = totalCentavos / participantesUnicos.length / 100;
      const { error: pagamentosError } = await supabase.from('pagamentos').insert(
        devedores.map(usuarioId => ({
          residenciaId: payload.residenciaId,
          despesaId: despesa.id,
          usuarioId,
          valor: valorPorPessoa,
          status: 'PENDENTE',
        })),
      );

      if (pagamentosError) {
        normalizeError(pagamentosError, 'Despesa criada, mas nao foi possivel dividir os pagamentos.');
      }
    }

    const { error: historicoError } = await supabase.from('historicos').insert({
      residenciaId: payload.residenciaId,
      usuarioId: payload.criadoPorId,
      acao: 'Despesa criada',
      descricao: `${payload.nome} - R$ ${Number(payload.valorTotal).toFixed(2)}`,
    });

    if (historicoError) {
      normalizeError(historicoError, 'Despesa criada, mas nao foi possivel salvar o historico.');
    }

    return {
      message: `Despesa ${despesa.nome} criada com sucesso!`,
      despesa: despesa as Despesa,
    };
  },
};

export const resumoFinanceiroService = {
  async get(usuarioId: string, residenciaId: string) {
    const pagamentos = await pagamentoService.list({
      residenciaId,
      status: 'PENDENTE',
    });

    const voceDeve = pagamentos
      .filter(pagamento => pagamento.usuarioId === usuarioId && pagamento.despesa?.criadoPorId !== usuarioId)
      .reduce((total, pagamento) => total + Number(pagamento.valor), 0);

    const teDevem = pagamentos
      .filter(pagamento => pagamento.usuarioId !== usuarioId && pagamento.despesa?.criadoPorId === usuarioId)
      .reduce((total, pagamento) => total + Number(pagamento.valor), 0);

    return {
      voceDeve,
      teDevem,
      saldoLiquido: teDevem - voceDeve,
    };
  },
};

export const pagamentoService = {
  async list(params?: {
    residenciaId?: string;
    usuarioId?: string;
    status?: Pagamento['status'];
  }) {
    let query = supabase
      .from('pagamentos')
      .select(`
        *,
        despesa:despesas(
          *,
          criadoPor:usuarios!despesas_criadoPorId_fkey(*)
        ),
        usuario:usuarios(*)
      `)
      .order('createdAt', { ascending: false });

    if (params?.residenciaId) {
      query = query.eq('residenciaId', params.residenciaId);
    }

    if (params?.usuarioId) {
      query = query.eq('usuarioId', params.usuarioId);
    }

    if (params?.status) {
      query = query.eq('status', params.status);
    }

    const { data, error } = await query;

    if (error) {
      normalizeError(error, 'Nao foi possivel listar pagamentos.');
    }

    return (data ?? []) as Pagamento[];
  },

  async update(id: string, payload: Partial<Pick<Pagamento, 'status' | 'comprovanteUrl' | 'observacao' | 'pagoEm'>>) {
    const { data, error } = await supabase
      .from('pagamentos')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      normalizeError(error, 'Nao foi possivel atualizar pagamento.');
    }

    return {
      message: 'Pagamento atualizado com sucesso!',
      pagamento: data as Pagamento,
    };
  },
};

export const uploadService = {
  async avatar(file: { uri: string; base64?: string | null; mimeType?: string | null }) {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throwMessage('Entre na conta antes de enviar a foto.');
    const contentType = file.mimeType ?? 'image/jpeg';
    const extension = contentType === 'image/png' ? 'png' : contentType === 'image/webp' ? 'webp' : contentType === 'image/heic' ? 'heic' : 'jpg';
    const bytes = file.base64 ? decode(file.base64) : await (await fetch(file.uri)).arrayBuffer();
    if (!bytes.byteLength || bytes.byteLength > 5 * 1024 * 1024) throwMessage('Escolha uma foto de até 5 MB.');
    const path = `avatares/${user!.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
    const { error } = await supabase.storage.from('comprovantes').upload(path, bytes, { contentType, upsert: false });
    if (error) normalizeError(error, 'Não foi possível enviar a foto. Tente novamente.');
    return { url: supabase.storage.from('comprovantes').getPublicUrl(path).data.publicUrl };
  },
  async comprovante(file: {
    uri: string;
    name?: string | null;
    mimeType?: string | null;
  }) {
    const fileName = file.name ?? `comprovante-${Date.now()}`;
    const mimeType = file.mimeType ?? 'application/octet-stream';
    const extension = fileName.includes('.') ? fileName.split('.').pop() : 'bin';
    const storagePath = `comprovantes/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
    const response = await fetch(file.uri);
    const blob = await response.blob();
    const reader = new FileReader();

    const base64 = await new Promise<string>((resolve, reject) => {
      reader.onerror = reject;
      reader.onload = () => {
        const result = String(reader.result);
        resolve(result.split(',')[1] ?? result);
      };
      reader.readAsDataURL(blob);
    });

    const { error } = await supabase.storage
      .from('comprovantes')
      .upload(storagePath, decode(base64), {
        contentType: mimeType,
        upsert: false,
      });

    if (error) {
      normalizeError(error, 'Nao foi possivel enviar o comprovante.');
    }

    const { data } = supabase.storage.from('comprovantes').getPublicUrl(storagePath);

    return {
      message: 'Comprovante enviado com sucesso!',
      url: data.publicUrl,
    };
  },
};

export const notificacaoService = {
  async enviarCobranca(pagamentoId: string) {
    const { data, error } = await supabase.functions.invoke('send-charge-email', {
      body: { pagamentoId },
    });
    if (error) {
      let message = 'Nao foi possivel enviar a cobranca. Confira a configuracao de e-mail.';
      if (error.context instanceof Response) {
        try { message = (await error.context.json()).message || message; } catch { /* Keep a readable fallback. */ }
      }
      throwMessage(message);
    }
    if (!data?.providerId || !data?.acceptedAt) throwMessage('O servico nao confirmou a aceitacao do envio.');
    return data as { message: string; providerId: string; acceptedAt: string };
  },
};

export const historicoService = {
  async list() {
    const { data, error } = await supabase
      .from('historicos')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) {
      normalizeError(error, 'Nao foi possivel listar historico.');
    }

    return (data ?? []) as Historico[];
  },

  async create(payload: Pick<Historico, 'residenciaId' | 'usuarioId' | 'acao' | 'descricao'>) {
    const { data, error } = await supabase
      .from('historicos')
      .insert(payload)
      .select('*')
      .single();

    if (error) {
      normalizeError(error, 'Nao foi possivel criar historico.');
    }

    return {
      message: 'Historico criado com sucesso!',
      historico: data as Historico,
    };
  },
};
