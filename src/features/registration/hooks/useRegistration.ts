import { authService, getApiErrorMessage } from '@/services/api';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { appAlert as Alert } from '@/components/appAlert';

export function useRegistration() {
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoAsset, setPhotoAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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
      base64: true,
    });

    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
      setPhotoAsset(result.assets[0]);
    }
  };

  const handleRegister = async () => {
    if (loading || successMessage) return;
    setErrorMessage('');
    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
      setErrorMessage('Preencha todos os campos obrigatórios.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMessage('Informe um e-mail válido.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    setSuccessMessage('');
    try {
      const result = await authService.register(fullName.trim(), email.trim(), password, photoUri, photoAsset ?? undefined);
      setSuccessMessage(result.photoSaved ? 'Conta criada com sucesso! Redirecionando para o login...' : 'Conta criada! A foto não foi salva. Adicione sua foto pelo Perfil após entrar. Redirecionando para o login...');
      setTimeout(() => router.replace('/login'), result.photoSaved ? 1500 : 5000);
    } catch (error: any) {
      setErrorMessage(getApiErrorMessage(error, 'Não foi possível criar a conta. Tente novamente.'));
    } finally {
      setLoading(false);
    }
  };

  return {
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
  };
}
