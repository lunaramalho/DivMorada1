import { createClient } from 'npm:@supabase/supabase-js@2.110.0';
import { buildChargeEmail } from './email.mjs';

const env = (key: string) => Deno.env.get(key) ?? '';
const allowedOrigins = env('CHARGE_ALLOWED_ORIGINS').split(',').map(value => value.trim()).filter(Boolean);

Deno.serve(async request => {
  const origin = request.headers.get('origin');
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': origin && allowedOrigins.includes(origin) ? origin : '',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
  const reply = (status: number, body: object) => new Response(JSON.stringify(body), { status, headers });
  if (origin && !allowedOrigins.includes(origin)) return reply(403, { message: 'Origem nao autorizada.' });
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (request.method !== 'POST') return reply(405, { message: 'Metodo nao permitido.' });
  const token = request.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];
  if (!token) return reply(401, { message: 'Entre na sua conta para enviar uma cobranca.' });
  if (!env('RESEND_API_KEY') || !env('CHARGE_EMAIL_FROM')) return reply(503, { message: 'Envio de e-mail ainda nao configurado.' });

  const admin = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false } });
  const { data: auth, error: authError } = await admin.auth.getUser(token);
  if (authError || !auth.user) return reply(401, { message: 'Sessao invalida. Entre novamente.' });
  let pagamentoId: string;
  try {
    const body = await request.json();
    if (Object.keys(body).some(key => key !== 'pagamentoId') || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.pagamentoId)) throw new Error();
    pagamentoId = body.pagamentoId;
  } catch { return reply(400, { message: 'Informe uma parcela valida.' }); }

  try {
    const { data: payment, error } = await admin.from('pagamentos').select('*, despesa:despesas(*)').eq('id', pagamentoId).single();
    if (error || !payment || !payment.despesa || payment.despesa.criadoPorId !== auth.user.id) return reply(403, { message: 'Somente o credor pode cobrar esta parcela.' });
    const { data: debtor } = await admin.auth.admin.getUserById(payment.usuarioId);
    if (!debtor.user?.email || !debtor.user.email_confirmed_at) return reply(422, { message: 'O morador precisa confirmar seu e-mail antes de receber cobrancas.' });
    const [{ data: house }, { data: profiles }] = await Promise.all([
      admin.from('residencias').select('nome').eq('id', payment.residenciaId).single(),
      admin.from('usuarios').select('id,nome').in('id', [auth.user.id, payment.usuarioId]),
    ]);
    if (!house || !profiles) throw new Error('Dados indisponiveis.');
    const payload = buildChargeEmail({
      house: house.nome, expense: payment.despesa.nome,
      debtor: profiles.find(person => person.id === payment.usuarioId)?.nome ?? 'morador',
      creditor: profiles.find(person => person.id === auth.user.id)?.nome ?? 'morador',
      amount: payment.valor, from: env('CHARGE_EMAIL_FROM'), to: debtor.user.email,
    });
    const { data: attempt, error: reservationError } = await admin.rpc('reserve_charge_email', { p_payment: pagamentoId, p_actor: auth.user.id, p_payload: payload });
    if (reservationError) return reply(409, { message: reservationError.message });
    if (attempt.payload.to?.[0] !== debtor.user.email) {
      return reply(409, { message: 'O e-mail do morador mudou durante uma tentativa pendente. Confira o envio no Resend antes de tentar novamente.' });
    }
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env('RESEND_API_KEY')}`, 'Content-Type': 'application/json', 'Idempotency-Key': `charge/${attempt.id}` },
      body: JSON.stringify(attempt.payload), signal: AbortSignal.timeout(20000),
    });
    const result = await response.json();
    if (!response.ok || !result.id) return reply(502, { message: 'O servico de e-mail nao confirmou o envio. Aguarde e tente novamente; a mesma tentativa sera reutilizada.' });
    const { data: accepted, error: finishError } = await admin.rpc('accept_charge_email', { p_attempt: attempt.id, p_provider_id: result.id });
    if (finishError) return reply(503, { message: 'O provedor aceitou o envio, mas o registro esta pendente. Tente novamente em alguns minutos para reconciliar, sem duplicar o e-mail.' });
    return reply(200, { message: 'Envio aceito pelo servico de e-mail.', providerId: result.id, acceptedAt: accepted });
  } catch {
    return reply(503, { message: 'Nao foi possivel confirmar o envio. Tente novamente em alguns minutos. Nenhuma nova tentativa sera criada enquanto houver um envio pendente.' });
  }
});
