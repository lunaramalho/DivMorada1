import { getApiErrorMessage, residenciaUsuarioService, usuarioService, uploadService } from '@/services/api';
import { session } from '@/services/session';
import { supabase } from '@/services/supabase';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { appAlert as Alert } from '@/components/appAlert';

type Modality = 'Administrador' | 'Morador';

export function useProfile() {
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
      base64: true,
    });

    if (result.canceled) {
      return;
    }

    setSaving(true);
    try {
      const asset = result.assets[0];
      const { url: nextPhotoUri } = await uploadService.avatar({ uri: asset.uri, base64: asset.base64, mimeType: asset.mimeType });
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
      await usuarioService.update(user.id, { senha: newPassword, senhaAtual: currentPassword });
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
        onPress: async () => {
          try {
            const { error } = await supabase.auth.signOut({ scope: 'local' });
            if (error) throw error;
            session.clear();
            router.replace('/(auth)/login');
          } catch (error: any) {
            Alert.alert('Erro ao sair', getApiErrorMessage(error, 'Não foi possível sair da conta. Tente novamente.'));
          }
        },
      },
    ]);
  };

  return {
    router,
    name,
    email,
    photoUri,
    modality,
    editName,
    saving,
    currentPassword,
    newPassword,
    confirmPassword,
    showPasswordForm,
    showCurrent,
    showNew,
    showConfirm,
    setName,
    setEditName,
    setCurrentPassword,
    setNewPassword,
    setConfirmPassword,
    setShowPasswordForm,
    setShowCurrent,
    setShowNew,
    setShowConfirm,
    handleSave,
    handleChangePhoto,
    handleChangePassword,
    handleLogout,
  };
}
