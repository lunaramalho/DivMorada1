import { useState } from 'react';
import { Platform, Pressable, Text } from 'react-native';
import * as Linking from 'expo-linking';
import { Input } from '@/components/Input';
import { supabase } from '@/services/supabase';
import { RecoveryLayout, recoveryStyles as styles } from '@/features/password-recovery/components/RecoveryLayout';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const redirectTo = Platform.OS === 'web' ? `${window.location.origin}/reset-password` : Linking.createURL('reset-password');
  const request = async () => {
    if (busy || sent) return;
    setError('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('Informe um e-mail válido.'); return; }
    setBusy(true);
    try {
      const { error: authError } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
      if (authError) throw authError;
      setSent(true);
    } catch { setError('Não foi possível solicitar o link agora. Aguarde alguns instantes e tente novamente.'); }
    finally { setBusy(false); }
  };
  return <RecoveryLayout title="Esqueci minha senha" description="Informe seu e-mail para receber um link de recuperação de senha.">
    {sent ? <Text accessibilityRole="alert" style={styles.success}>Se houver uma conta com esse e-mail, você receberá as instruções. Confira também a pasta de spam.</Text> : <>
      <Input label="E-mail" placeholder="seu@email.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} editable={!busy} />
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      <Pressable accessibilityRole="button" disabled={busy} onPress={() => void request()} style={[styles.button, busy && styles.disabled]}><Text style={styles.buttonText}>{busy ? 'Enviando...' : 'Enviar link de recuperação'}</Text></Pressable>
    </>}
  </RecoveryLayout>;
}
