import {
  residenciaService,
  residenciaUsuarioService,
  getApiErrorMessage,
} from '@/services/api';
import { session } from '@/services/session';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { appAlert as Alert } from '@/components/appAlert';
import type { HouseOnboardingTab } from '../types';

export function useHouseOnboarding() {
  const router = useRouter();
  const [tab, setTab] = useState<HouseOnboardingTab>('join');
  const [code, setCode] = useState('');
  const [houseName, setHouseName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    if (loading) return;
    if (!code.trim()) {
      Alert.alert('Atencao', 'Digite o codigo de convite da casa.');
      return;
    }

    const user = session.getUser();
    if (!user) {
      router.replace('/login');
      return;
    }

    setLoading(true);
    try {
      const residencia = await residenciaService.joinByCodigo(code.trim().toUpperCase());
      session.setResidencia(residencia);
      Alert.alert('Casa encontrada!', `Voce entrou em "${residencia.nome}".`, [
        { text: 'OK', onPress: () => router.replace('/(tabs)') },
      ]);
    } catch (error: any) {
      Alert.alert(
        'Erro ao entrar na casa',
        getApiErrorMessage(error, 'Nao foi possivel entrar nessa casa.'),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (loading) return;
    if (!houseName.trim()) {
      Alert.alert('Atencao', 'Digite um nome para a sua casa.');
      return;
    }

    const user = session.getUser();
    if (!user) {
      router.replace('/login');
      return;
    }

    setLoading(true);
    try {
      const { residencia } = await residenciaService.create(houseName.trim());

      await residenciaUsuarioService.create(residencia.id, user.id, 'dono');
      session.setResidencia(residencia);
      Alert.alert('Casa criada!', `"${residencia.nome}" foi criada. Codigo: ${residencia.codigo}`, [
        { text: 'OK', onPress: () => router.replace('/(tabs)') },
      ]);
    } catch (error: any) {
      Alert.alert(
        'Erro ao criar casa',
        getApiErrorMessage(error, error.message || 'Nao foi possivel criar a casa.'),
      );
    } finally {
      setLoading(false);
    }
  };

  return { router, tab, setTab, code, setCode, houseName, setHouseName, loading, handleJoin, handleCreate };
}
