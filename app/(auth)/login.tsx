import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '@/styles/theme';
import { LoginHeader } from '@/features/login/components/LoginHeader';
import { LoginForm } from '@/features/login/components/LoginForm';
import { useLogin } from '@/features/login/hooks/useLogin';

export default function LoginScreen() {
  const { router, email, setEmail, senha, setSenha, showPassword, setShowPassword, loading, errorMessage, handleLogin } = useLogin();

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <LoginHeader />

        <LoginForm
          email={email}
          setEmail={setEmail}
          senha={senha}
          setSenha={setSenha}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          loading={loading}
          errorMessage={errorMessage}
          handleLogin={handleLogin}
        />

        <View style={styles.footer}>
          <Text style={styles.footerText}>Não tem conta? </Text>
          <TouchableOpacity onPress={() => router.push("/register")}>
            <Text style={styles.linkText}>Criar conta</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  content: { flex: 1, paddingHorizontal: 30, justifyContent: "center" },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 30 },
  footerText: { color: "#888", fontSize: 14 },
  linkText: { color: COLORS.primary, fontWeight: "bold", fontSize: 14 },
});
