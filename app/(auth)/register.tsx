import { Input } from '@/components/Input';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { authService, getApiErrorMessage } from '@/services/api';
import { COLORS } from '@/styles/theme';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function RegisterScreen() {
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permissao necessaria', 'Permita acesso a galeria para escolher sua foto.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleRegister = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      Alert.alert('Atencao', 'Preencha todos os campos obrigatorios.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Atencao', 'A senha deve ter no minimo 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Atencao', 'As senhas nao coincidem.');
      return;
    }

    setLoading(true);
    setSuccessMessage('');
    try {
      await authService.register(fullName.trim(), email.trim(), password, photoUri);
      setSuccessMessage('Conta criada com sucesso! Redirecionando para o login...');
      setTimeout(() => router.replace('/login'), 1500);
    } catch (error: any) {
      Alert.alert(
        'Erro ao cadastrar',
        getApiErrorMessage(error, 'Erro ao tentar criar conta.'),
      );
    } finally {
      setLoading(false);
    }
  };

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
              Casa <Text style={{ color: COLORS.primary }}>DivMorada</Text>
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Criar Nova Conta</Text>

            <Text style={styles.sectionLabel}>Informacoes do Usuario</Text>

            <View style={styles.avatarRow}>
              <TouchableOpacity style={styles.avatarCircle} onPress={handlePickPhoto}>
                {photoUri ? (
                  <Image source={{ uri: photoUri }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarLetter}>
                    {fullName.trim().charAt(0).toUpperCase() || 'A'}
                  </Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.avatarTextBox} onPress={handlePickPhoto}>
                <Text style={styles.avatarHint}>
                  {photoUri ? 'Foto selecionada. Toque para trocar.' : 'Clique para escolher sua foto\nde perfil'}
                </Text>
              </TouchableOpacity>
            </View>

            <Input
              label="Nome Completo:"
              placeholder="Ana Paula Silva"
              value={fullName}
              onChangeText={setFullName}
            />

            <Input
              label="E-mail:"
              placeholder="ana.silva@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Input
              label="Senha (minimo 6 caracteres):"
              placeholder="******"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              rightElement={
                <TouchableOpacity
                  onPress={() => setShowPassword(prev => !prev)}
                  style={styles.passwordToggle}
                >
                  <MaterialCommunityIcons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={22}
                    color="#777"
                  />
                </TouchableOpacity>
              }
            />

            <Input
              label="Confirmar Senha:"
              placeholder="******"
              value={confirmPassword}
              onChangeText={setConfirm}
              secureTextEntry={!showConfirmPassword}
              rightElement={
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(prev => !prev)}
                  style={styles.passwordToggle}
                >
                  <MaterialCommunityIcons
                    name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={22}
                    color="#777"
                  />
                </TouchableOpacity>
              }
            />
          </View>

          {successMessage ? (
            <View style={styles.successBox}>
              <MaterialCommunityIcons name="check-circle-outline" size={22} color="#1abc9c" />
              <Text style={styles.successText}>{successMessage}</Text>
            </View>
          ) : null}

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
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.linkText}>Entrar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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

  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarLetter: { color: '#FFF', fontSize: 22, fontWeight: 'bold' },
  avatarTextBox: {
    flex: 1,
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  avatarHint: { color: '#777', fontSize: 13, lineHeight: 18 },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#eafaf1',
    borderWidth: 1,
    borderColor: '#1abc9c',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  successText: { flex: 1, color: '#168f78', fontWeight: '700', fontSize: 14 },

  mainBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 20,
  },
  mainBtnDisabled: { opacity: 0.7 },
  mainBtnText: { color: '#FFF', fontSize: 17, fontWeight: 'bold' },
  passwordToggle: { paddingLeft: 10, paddingVertical: 10 },

  footer: { flexDirection: 'row', justifyContent: 'center' },
  footerText: { color: '#888', fontSize: 14 },
  linkText: { color: COLORS.primary, fontWeight: 'bold', fontSize: 14 },
});
