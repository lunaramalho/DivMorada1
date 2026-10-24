import { useState } from 'react';
import { useRouter } from 'expo-router';
import { authService, getApiErrorMessage } from '@/services/api';
import { session } from '@/services/session';

export function useLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async () => {
    if (loading) return;
    setErrorMessage('');
    if (!email.trim() || !senha.trim()) {
      setErrorMessage('Informe e-mail e senha.');
      return;
    }

    setLoading(true);
    try {
      await authService.login(email.trim(), senha);
      router.replace(session.getResidencia() ? "/(tabs)" : "/join-house");
    } catch (error: any) {
      setErrorMessage(getApiErrorMessage(error, 'Não foi possível entrar. Tente novamente.'));
    } finally {
      setLoading(false);
    }
  };

  return { router, email, setEmail, senha, setSenha, showPassword, setShowPassword, loading, errorMessage, handleLogin };
}
