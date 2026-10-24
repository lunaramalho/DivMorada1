import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, Text } from 'react-native';
import { Input } from '@/components/Input';
import { RecoveryLayout, recoveryStyles as styles } from '@/features/password-recovery/components/RecoveryLayout';
import { usePasswordRecovery } from '@/features/password-recovery/hooks/usePasswordRecovery';

export default function ResetPasswordScreen() {
  const recovery = usePasswordRecovery();
  const router = useRouter();
  return <RecoveryLayout title="Redefinir senha" description="Escolha uma nova senha com pelo menos 8 caracteres.">
    {recovery.checking ? <ActivityIndicator color="#229c76" /> : recovery.success ? <Text accessibilityRole="alert" style={styles.success}>Senha alterada com sucesso! Volte ao login para entrar com sua nova senha.</Text> : <>
      {recovery.ready && <>
        <Input label="Nova senha" value={recovery.password} onChangeText={recovery.setPassword} secureTextEntry autoCapitalize="none" autoCorrect={false} editable={!recovery.busy} />
        <Input label="Confirmar nova senha" value={recovery.confirmation} onChangeText={recovery.setConfirmation} secureTextEntry autoCapitalize="none" autoCorrect={false} editable={!recovery.busy} />
      </>}
      {recovery.error ? <Text accessibilityRole="alert" style={styles.error}>{recovery.error}</Text> : null}
      {recovery.ready ? <Pressable accessibilityRole="button" disabled={recovery.busy} onPress={() => void recovery.save()} style={[styles.button, recovery.busy && styles.disabled]}><Text style={styles.buttonText}>{recovery.busy ? 'Salvando...' : 'Salvar nova senha'}</Text></Pressable> : <Pressable accessibilityRole="button" style={styles.button} onPress={() => router.replace('/forgot-password')}><Text style={styles.buttonText}>Solicitar novo link</Text></Pressable>}
    </>}
  </RecoveryLayout>;
}
