import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getApiErrorMessage, residenciaUsuarioService, usuarioService } from '@/services/api';
import { session } from '@/services/session';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type Modality = 'Administrador' | 'Morador';

export default function ProfileScreen() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [modality, setModality] = useState<Modality>('Morador');
  const [editName, setEditName] = useState(false);
  const [saving, setSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const loadProfile = useCallback(async () => {
    const user = session.getUser();

    if (!user) {
      router.replace('/(auth)/login');
      return;
    }

    setName(user.nome);
    setEmail(user.email);
    setPhotoUri(user.fotoUrl ?? null);

    const residencia = session.getResidencia();
    if (!residencia) {
      setModality('Morador');
      return;
    }

    try {
      const moradores = await residenciaUsuarioService.list();
      const moradorAtual = moradores.find(
        item => item.usuarioId === user.id && item.residenciaId === residencia.id,
      );

      setModality(moradorAtual?.role === 'dono' ? 'Administrador' : 'Morador');
    } catch {
      setModality('Morador');
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile]),
  );

  const handleSave = async () => {
    const user = session.getUser();

    if (!user) {
      router.replace('/(auth)/login');
      return;
    }

    if (!name.trim()) {
      Alert.alert('Atencao', 'Informe seu nome.');
      return;
    }

    setSaving(true);
    try {
      await usuarioService.update(user.id, { nome: name.trim() });
      session.setAuth(session.getToken() ?? '', {
        ...user,
        nome: name.trim(),
      });
      Alert.alert('Salvo!', 'Suas alteracoes foram salvas com sucesso.');
      setEditName(false);
    } catch (error: any) {
      Alert.alert('Erro', getApiErrorMessage(error, 'Nao foi possivel salvar o perfil.'));
    } finally {
      setSaving(false);
    }
  };

  const handleChangePhoto = async () => {
    const user = session.getUser();

    if (!user) {
      router.replace('/(auth)/login');
      return;
    }

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

    if (result.canceled) {
      return;
    }

    const nextPhotoUri = result.assets[0].uri;

    setSaving(true);
    try {
      await usuarioService.update(user.id, { fotoUrl: nextPhotoUri });
      setPhotoUri(nextPhotoUri);
      session.setAuth(session.getToken() ?? '', {
        ...user,
        fotoUrl: nextPhotoUri,
      });
      Alert.alert('Foto atualizada', 'Sua foto de perfil foi alterada.');
    } catch (error: any) {
      Alert.alert('Erro', getApiErrorMessage(error, 'Nao foi possivel alterar a foto.'));
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    const user = session.getUser();

    if (!user) {
      router.replace('/(auth)/login');
      return;
    }

    if (!currentPassword) {
      Alert.alert('Atencao', 'Informe a senha atual.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Atencao', 'A nova senha deve ter no minimo 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Atencao', 'As senhas nao coincidem.');
      return;
    }

    setSaving(true);
    try {
      await usuarioService.update(user.id, { senha: newPassword });
      Alert.alert('Senha alterada!', 'Sua senha foi atualizada com sucesso.', [
        {
          text: 'OK',
          onPress: () => {
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setShowPasswordForm(false);
          },
        },
      ]);
    } catch (error: any) {
      Alert.alert('Erro', getApiErrorMessage(error, 'Nao foi possivel alterar a senha.'));
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sair', 'Deseja sair da conta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: () => {
          session.clear();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.logo}>Casa <Text style={styles.brand}>DivMorada</Text></Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Seu Perfil</Text>

        <View style={styles.photoSection}>
          <View style={styles.photoCircle}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.photoImage} />
            ) : (
              <Text style={styles.photoLetter}>
                {name.trim().charAt(0).toUpperCase() || 'U'}
              </Text>
            )}
          </View>
          <TouchableOpacity style={styles.btnPhoto} onPress={handleChangePhoto}>
            <Text style={styles.btnPhotoText}>Alterar Foto</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.fieldRow}>
            <MaterialCommunityIcons name="account-outline" size={20} color="#888" />
            <View style={styles.fieldContent}>
              <Text style={styles.fieldLabel}>Nome:</Text>
              {editName ? (
                <TextInput
                  style={styles.fieldInput}
                  value={name}
                  onChangeText={setName}
                  autoFocus
                />
              ) : (
                <Text style={styles.fieldValue}>{name || 'Usuario'}</Text>
              )}
            </View>
            <TouchableOpacity onPress={() => setEditName(true)}>
              <MaterialCommunityIcons name="pencil-outline" size={20} color="#1abc9c" />
            </TouchableOpacity>
          </View>

          <View style={styles.separator} />

          <View style={styles.fieldRow}>
            <MaterialCommunityIcons name="email-outline" size={20} color="#888" />
            <View style={styles.fieldContent}>
              <Text style={styles.fieldLabel}>E-mail:</Text>
              <Text style={styles.fieldValue}>{email || 'Sem email'}</Text>
            </View>
          </View>

          <View style={styles.separator} />

          <View style={styles.fieldRow}>
            <MaterialCommunityIcons name="account-group-outline" size={20} color="#888" />
            <View style={styles.fieldContent}>
              <Text style={styles.fieldLabel}>Modalidade</Text>
              <View style={styles.modalityRow}>
                <Text style={[styles.modalityText, modality === 'Administrador' && styles.modalityActive]}>
                  Administrador {modality === 'Administrador' ? '✓' : ''}
                </Text>
                <Text style={[styles.modalityText, modality === 'Morador' && styles.modalityActive]}>
                  Morador {modality === 'Morador' ? '✓' : ''}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <TouchableOpacity
            style={styles.passwordHeader}
            onPress={() => setShowPasswordForm(prev => !prev)}
          >
            <View style={styles.passwordHeaderLeft}>
              <MaterialCommunityIcons name="lock-outline" size={20} color="#888" />
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.fieldLabel}>Senha</Text>
                <Text style={styles.fieldValue}>********</Text>
              </View>
            </View>
            <MaterialCommunityIcons
              name={showPasswordForm ? 'chevron-up' : 'chevron-down'}
              size={22}
              color="#1abc9c"
            />
          </TouchableOpacity>

          {showPasswordForm && (
            <View style={styles.passwordForm}>
              <View style={styles.separator} />

              <Text style={styles.passLabel}>Senha Atual:</Text>
              <View style={styles.passInputRow}>
                <TextInput
                  style={styles.passInput}
                  placeholder="Digite sua senha atual"
                  placeholderTextColor="#bbb"
                  secureTextEntry={!showCurrent}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                />
                <TouchableOpacity onPress={() => setShowCurrent(prev => !prev)}>
                  <MaterialCommunityIcons
                    name={showCurrent ? 'eye-off-outline' : 'eye-outline'}
                    size={20} color="#aaa"
                  />
                </TouchableOpacity>
              </View>

              <Text style={styles.passLabel}>Nova Senha:</Text>
              <View style={styles.passInputRow}>
                <TextInput
                  style={styles.passInput}
                  placeholder="Minimo 6 caracteres"
                  placeholderTextColor="#bbb"
                  secureTextEntry={!showNew}
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
                <TouchableOpacity onPress={() => setShowNew(prev => !prev)}>
                  <MaterialCommunityIcons
                    name={showNew ? 'eye-off-outline' : 'eye-outline'}
                    size={20} color="#aaa"
                  />
                </TouchableOpacity>
              </View>

              <Text style={styles.passLabel}>Confirmar Nova Senha:</Text>
              <View style={styles.passInputRow}>
                <TextInput
                  style={styles.passInput}
                  placeholder="Repita a nova senha"
                  placeholderTextColor="#bbb"
                  secureTextEntry={!showConfirm}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
                <TouchableOpacity onPress={() => setShowConfirm(prev => !prev)}>
                  <MaterialCommunityIcons
                    name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                    size={20} color="#aaa"
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.btnChangePass, saving && styles.btnDisabled]}
                onPress={handleChangePassword}
                disabled={saving}
              >
                <Text style={styles.btnChangePassText}>
                  {saving ? 'Salvando...' : 'Alterar Senha'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.btnSave, saving && styles.btnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.btnSaveText}>
            {saving ? 'Salvando...' : 'Salvar Alteracoes'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnLogout} onPress={handleLogout}>
          <MaterialCommunityIcons name="logout" size={18} color="#e74c3c" />
          <Text style={styles.btnLogoutText}>Sair da Conta</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f4f6f5' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10,
    backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee',
  },
  backBtn: { marginRight: 10, padding: 4 },
  backArrow: { fontSize: 30, color: '#1abc9c', lineHeight: 32 },
  logo: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  brand: { color: '#1abc9c' },

  content: { padding: 20, paddingBottom: 48, alignItems: 'center' },
  pageTitle: { fontSize: 24, fontWeight: 'bold', color: '#888', marginBottom: 24, alignSelf: 'center' },

  photoSection: { alignItems: 'center', marginBottom: 28 },
  photoCircle: {
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: '#bdc3c7',
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
    overflow: 'hidden',
  },
  photoImage: { width: '100%', height: '100%' },
  photoLetter: { color: '#fff', fontSize: 44, fontWeight: 'bold' },
  btnPhoto: { backgroundColor: '#1abc9c', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 24 },
  btnPhotoText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  card: {
    backgroundColor: '#fff', borderRadius: 16,
    width: '100%', padding: 4,
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07, shadowRadius: 4,
    marginBottom: 16,
  },
  separator: { height: 1, backgroundColor: '#f0f0f0', marginHorizontal: 16 },

  fieldRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 16, gap: 10,
  },
  fieldContent: { flex: 1 },
  fieldLabel: { fontSize: 11, color: '#aaa', fontWeight: '600', marginBottom: 2 },
  fieldValue: { fontSize: 15, color: '#222', fontWeight: '600' },
  fieldInput: {
    fontSize: 15, color: '#222', fontWeight: '600',
    borderBottomWidth: 1.5, borderColor: '#1abc9c', paddingVertical: 2,
  },

  modalityRow: { flexDirection: 'row', gap: 20, marginTop: 4 },
  modalityText: { fontSize: 14, color: '#aaa', fontWeight: '600' },
  modalityActive: { color: '#1abc9c' },

  passwordHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, paddingHorizontal: 16,
  },
  passwordHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
  passwordForm: { paddingHorizontal: 16, paddingBottom: 16, paddingTop: 4 },

  passLabel: { fontSize: 12, color: '#888', fontWeight: '600', marginTop: 14, marginBottom: 6 },
  passInputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#ddd', borderRadius: 10,
    paddingHorizontal: 12, backgroundColor: '#fafafa',
  },
  passInput: { flex: 1, height: 44, fontSize: 14, color: '#333' },

  btnChangePass: {
    backgroundColor: '#1abc9c', borderRadius: 10,
    paddingVertical: 12, alignItems: 'center', marginTop: 18,
  },
  btnChangePassText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  btnSave: {
    backgroundColor: '#1abc9c', borderRadius: 14,
    paddingVertical: 18, alignItems: 'center',
    width: '100%', marginBottom: 16, marginTop: 8,
  },
  btnDisabled: { opacity: 0.7 },
  btnSaveText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  btnLogout: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12 },
  btnLogoutText: { color: '#e74c3c', fontWeight: '600', fontSize: 14 },
});
