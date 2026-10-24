import { Input } from '@/components/Input';
import { COLORS } from '@/styles/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import type { useLogin } from '../hooks/useLogin';
import { useRouter } from 'expo-router';

type Props = Pick<ReturnType<typeof useLogin>,
  | 'email'
  | 'setEmail'
  | 'senha'
  | 'setSenha'
  | 'showPassword'
  | 'setShowPassword'
  | 'loading'
  | 'errorMessage'
  | 'handleLogin'
>;

export function LoginForm({
  email,
  setEmail,
  senha,
  setSenha,
  showPassword,
  setShowPassword,
  loading,
  errorMessage,
  handleLogin,
}: Props) {
  const router = useRouter();
  return (
    <>
      <Input
        label="Email"
        placeholder="seu@email.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Input
        label="Senha"
        placeholder="........"
        value={senha}
        onChangeText={setSenha}
        secureTextEntry={!showPassword}
        rightElement={
          <TouchableOpacity
            onPress={() => setShowPassword(prev => !prev)}
            style={styles.passwordToggle}
          >
            <MaterialCommunityIcons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={22}
              color="#777"
            />
          </TouchableOpacity>
        }
      />

      <TouchableOpacity accessibilityRole="button" onPress={() => router.push('/forgot-password')} style={styles.forgot}><Text style={styles.forgotText}>Esqueci minha senha</Text></TouchableOpacity>
      {errorMessage ? <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>{errorMessage}</Text> : null}

      <TouchableOpacity
        onPress={handleLogin}
        style={[styles.mainBtn, loading && styles.mainBtnDisabled]}
        disabled={loading}
      >
        <Text style={styles.mainBtnText}>{loading ? "Entrando..." : "Entrar"}</Text>
      </TouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
  forgot: { alignSelf: 'flex-end', paddingVertical: 12 },
  forgotText: { color: '#168f78', fontWeight: '600', fontSize: 14 },
  error: { color: '#a93232', backgroundColor: '#fff2f2', borderRadius: 8, padding: 12, marginTop: 8, fontSize: 14 },
  mainBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: "center",
    marginTop: 20,
  },
  mainBtnDisabled: { opacity: 0.7 },
  mainBtnText: { color: "#FFF", fontSize: 18, fontWeight: "bold" },
  passwordToggle: { paddingLeft: 10, paddingVertical: 10 },
});
