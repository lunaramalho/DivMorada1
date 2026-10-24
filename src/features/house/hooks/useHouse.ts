import * as Clipboard from 'expo-clipboard';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { appAlert as Alert } from '@/components/appAlert';
import {
  residenciaService,
  residenciaUsuarioService,
  getApiErrorMessage,
  usuarioService,
  type Residencia,
  type ResidenciaUsuario,
  type Usuario,
} from '@/services/api';
import { session } from '@/services/session';
import type { Resident } from '../types';

const AVATAR_COLORS = ['#c0392b', '#2980b9', '#1abc9c', '#8e44ad', '#e67e22'];

export function useHouse() {
  const router = useRouter();
  const [residents, setResidents] = useState<Resident[]>([]);
  const [residencia, setResidencia] = useState<Residencia | null>(session.getResidencia());
  const [loading, setLoading] = useState(false);
  const [canManage, setCanManage] = useState(false);

  const loadHouse = useCallback(async () => {
    setLoading(true);
    try {
      let currentResidencia = session.getResidencia();

      if (!currentResidencia) {
        const residencias = await residenciaService.list();
        currentResidencia = residencias[0] ?? null;
        session.setResidencia(currentResidencia);
      }

      setResidencia(currentResidencia);

      if (!currentResidencia) {
        setResidents([]);
        return;
      }

      const [moradores, usuarios] = await Promise.all([
        residenciaUsuarioService.list(),
        usuarioService.list(),
      ]);

      const residentsFromApi = moradores
        .filter((item: ResidenciaUsuario) => item.residenciaId === currentResidencia?.id)
        .map((morador, index) => {
          const usuario = usuarios.find((item: Usuario) => item.id === morador.usuarioId);
          const name = usuario?.nome ?? 'Morador';

          return {
            id: morador.id,
            name,
            role: morador.role === 'dono' ? 'Administrador' : 'Membro',
            avatarLetter: name.trim().charAt(0).toUpperCase() || 'M',
            avatarColor: AVATAR_COLORS[index % AVATAR_COLORS.length],
            photoUri: usuario?.fotoUrl ?? null,
            confirmed: morador.ativo,
          } satisfies Resident;
        });

      setResidents(residentsFromApi);
      setCanManage(moradores.some(item => item.residenciaId === currentResidencia?.id && item.usuarioId === session.getUser()?.id && item.role === 'dono' && item.ativo));
    } catch (error: any) {
      Alert.alert(
        'Erro ao carregar casa',
        getApiErrorMessage(error, 'Nao foi possivel carregar os moradores.'),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHouse();
    }, [loadHouse]),
  );

  const handleCopyCode = async () => {
    if (!residencia?.codigo) {
      return;
    }

    try {
      const copied = await Clipboard.setStringAsync(residencia.codigo);
      if (copied === false) throw new Error('Clipboard unavailable');
      Alert.alert('Copiado!', `Codigo ${residencia.codigo} copiado.`);
    } catch { Alert.alert('Não foi possível copiar', 'Copie o código exibido na tela manualmente.'); }
  };

  const handleConfirm = async (id: string) => {
    try {
      await residenciaUsuarioService.update(id, { ativo: true });
      await loadHouse();
    } catch (error: any) {
      Alert.alert('Erro', getApiErrorMessage(error, 'Nao foi possivel confirmar morador.'));
    }
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Remover', `Remover ${name} da casa?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          try {
            await residenciaUsuarioService.delete(id);
            await loadHouse();
          } catch (error: any) {
            Alert.alert('Erro', getApiErrorMessage(error, 'Nao foi possivel remover morador.'));
          }
        },
      },
    ]);
  };

  return { router, residents, residencia, loading, canManage, handleCopyCode, handleConfirm, handleDelete };
}
