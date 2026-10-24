import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as ExpoLinking from 'expo-linking';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '@/services/supabase';
import { session } from '@/services/session';
import { parseRecoveryLink, recoveryUrlFromRouteHash, validateNewPassword } from '../recoveryLink';
import { takeNativeRecovery } from '../nativeRecovery';

export function usePasswordRecovery() {
  const params = useLocalSearchParams<{ '#': string; recoveryAttempt: string }>();
  const routeHash = params['#'];
  const recoveryAttempt = params.recoveryAttempt;
  const [checking, setChecking] = useState(true);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const recoveryUser = useRef<string | null>(null);
  const attempt = useRef<Promise<string> | null>(null);
  const previousSource = useRef<string | undefined>(undefined);
  useEffect(() => {
    let active = true;
    const source = recoveryAttempt ?? routeHash;
    if (previousSource.current !== source) {
      attempt.current = null;
      previousSource.current = source;
    }
    async function establish(url: string | null) {
      if (!url) throw new Error('Abra o link enviado ao seu e-mail para redefinir a senha.');
      let tokens;
      try { tokens = parseRecoveryLink(url); }
      finally {
        if (Platform.OS === 'web') window.history.replaceState(null, '', window.location.pathname);
        else ExpoLinking.clearInitialURL();
      }
      const { data, error: authError } = await supabase.auth.setSession(tokens);
      if (authError || !data.session || !data.user) throw new Error('Link inválido ou expirado. Solicite um novo link.');
      session.clear();
      return data.user.id;
    }
    const consume = async (url: string | null) => {
      if (!attempt.current) attempt.current = establish(url);
      try { const userId = await attempt.current; if (active) { recoveryUser.current = userId; setReady(true); setError(''); } }
      catch (err) { if (active) setError(err instanceof Error ? err.message : 'Não foi possível validar o link.'); }
      finally { if (active) setChecking(false); }
    };
    if (Platform.OS === 'web') void consume(window.location.href);
    else void consume(takeNativeRecovery() ?? recoveryUrlFromRouteHash(routeHash) ?? ExpoLinking.getLinkingURL());
    return () => { active = false; };
  }, [routeHash, recoveryAttempt]);
  const save = async () => {
    if (busy || !ready || success) return;
    const validation = validateNewPassword(password, confirmation);
    setError(validation);
    if (validation) return;
    setBusy(true);
    try {
      const { data, error: userError } = await supabase.auth.getUser();
      if (userError || data.user?.id !== recoveryUser.current) { setReady(false); throw new Error('Sua sessão de recuperação expirou. Solicite um novo link.'); }
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw new Error(updateError.code === 'same_password' ? 'Escolha uma senha diferente da anterior.' : 'Não foi possível alterar a senha. Tente novamente ou solicite um novo link.');
      setPassword(''); setConfirmation(''); setReady(false);
      const { error: logoutError } = await supabase.auth.signOut({ scope: 'local' });
      session.clear();
      if (logoutError) throw new Error('Senha alterada. Não foi possível encerrar a sessão. Volte ao login e entre com a nova senha.');
      setSuccess(true);
    } catch (err) { setError(err instanceof Error ? err.message : 'Não foi possível alterar a senha.'); }
    finally { setBusy(false); }
  };
  return { checking, ready, error, password, confirmation, setPassword, setConfirmation, busy, success, save };
}
