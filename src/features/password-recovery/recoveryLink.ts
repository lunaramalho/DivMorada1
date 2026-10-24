export function parseRecoveryLink(url: string) {
  const parsed = new URL(url);
  const params = new URLSearchParams(parsed.hash.slice(1));
  if (params.get('error') || parsed.searchParams.get('error')) throw new Error('Link inválido ou expirado. Solicite um novo link.');
  const access_token = params.get('access_token');
  const refresh_token = params.get('refresh_token');
  if (params.get('type') !== 'recovery' || !access_token || !refresh_token) throw new Error('Abra o link de recuperação enviado ao seu e-mail. Se ele expirou, solicite outro.');
  return { access_token, refresh_token };
}

export function recoveryUrlFromRouteHash(hash?: string | string[]): string | null {
  if (!hash || Array.isArray(hash)) return null;
  return `divmorada://reset-password#${hash.replace(/^#/, '')}`;
}
export function validateNewPassword(password: string, confirmation: string) {
  if (password.length < 8) return 'A nova senha deve ter no mínimo 8 caracteres.';
  if (password !== confirmation) return 'As senhas não coincidem.';
  return '';
}
