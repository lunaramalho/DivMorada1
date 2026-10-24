import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/styles/theme';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RegistrationPhotoPicker } from '@/features/registration/components/RegistrationPhotoPicker';
import { RegistrationFields } from '@/features/registration/components/RegistrationFields';
import { RegistrationSuccessMessage } from '@/features/registration/components/RegistrationSuccessMessage';
import { useRegistration } from '@/features/registration/hooks/useRegistration';

export default function RegisterScreen() {
  const {
    router,
    fullName,
    email,
    password,
    confirmPassword,
    showPassword,
    showConfirmPassword,
    photoUri,
    successMessage,
    errorMessage,
    loading,
    setFullName,
    setEmail,
    setPassword,
    setConfirm,
    setShowPassword,
    setShowConfirmPassword,
    handlePickPhoto,
    handleRegister,
  } = useRegistration();

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.logo}>
              <Text style={{ color: COLORS.primary }}>DivMorada</Text>
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Criar Nova Conta</Text>

            <Text style={styles.sectionLabel}>Informacoes do Usuario</Text>

            <RegistrationPhotoPicker
              fullName={fullName}
              photoUri={photoUri}
              handlePickPhoto={handlePickPhoto}
            />

            <RegistrationFields
              fullName={fullName}
              email={email}
              password={password}
              confirmPassword={confirmPassword}
              showPassword={showPassword}
              showConfirmPassword={showConfirmPassword}
              setFullName={setFullName}
              setEmail={setEmail}
              setPassword={setPassword}
              setConfirm={setConfirm}
              setShowPassword={setShowPassword}
              setShowConfirmPassword={setShowConfirmPassword}
            />
          </View>

          {errorMessage ? <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>{errorMessage}</Text> : null}
          <RegistrationSuccessMessage message={successMessage} />

          <TouchableOpacity
            style={[styles.mainBtn, loading && styles.mainBtnDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.mainBtnText}>
              {loading ? 'Cadastrando...' : 'Cadastrar & Comecar'}
            </Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Ja tem conta? </Text>
            <TouchableOpacity onPress={() => router.replace('/login')}>
              <Text style={styles.linkText}>Entrar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  error: { color: '#a93232', backgroundColor: '#fff2f2', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 14 },
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  content: { paddingHorizontal: 24, paddingVertical: 32 },

  header: { alignItems: 'center', marginBottom: 24 },
  logo: { fontSize: 28, fontWeight: 'bold', color: '#333' },

  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
    marginBottom: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  mainBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 20,
  },
  mainBtnDisabled: { opacity: 0.7 },
  mainBtnText: { color: '#FFF', fontSize: 17, fontWeight: 'bold' },
  footer: { flexDirection: 'row', justifyContent: 'center' },
  footerText: { color: '#888', fontSize: 14 },
  linkText: { color: COLORS.primary, fontWeight: 'bold', fontSize: 14 },
});
