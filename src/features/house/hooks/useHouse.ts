import * as Clipboard from 'expo-clipboard';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { appAlert as Alert } from '@/components/appAlert';
import {
  residenciaUsuarioService,
  getApiErrorMessage,
  usuarioService,
  type Residencia,
  type ResidenciaUsuario,
  type Usuario,
  type DeparturePending,
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
  const [canLeave, setCanLeave] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [blocker, setBlocker] = useState<{ name: string; own: boolean; pending: DeparturePending } | null>(null);

  const loadHouse = useCallback(async () => {
    setLoading(true);
    try {
      const currentResidencia = session.getResidencia();

      setResidencia(currentResidencia);

      if (!currentResidencia) {
        setResidents([]);
        router.replace('/join-house');
        return;
      }

      const [moradores, usuarios] = await Promise.all([
        residenciaUsuarioService.list(),
        usuarioService.list(),
      ]);

      const residentsFromApi = moradores
        .filter((item: ResidenciaUsuario) => item.residenciaId === currentResidencia.id && item.ativo)
        .map((morador, index) => {
          const usuario = usuarios.find((item: Usuario) => item.id === morador.usuarioId);
          const name = usuario?.nome ?? 'Morador';

          return {
            id: morador.id,
            usuarioId: morador.usuarioId,
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
      setCanLeave(moradores.some(item => item.residenciaId === currentResidencia.id && item.usuarioId === session.getUser()?.id && item.role === 'membro' && item.ativo));
    } catch (error: any) {
      Alert.alert(
        'Erro ao carregar casa',
        getApiErrorMessage(error, 'Nao foi possivel carregar os moradores.'),
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

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

  const requestDeparture = async (usuarioId: string, name: string, own: boolean) => {
    if (!residencia || leaving) return;
    setLeaving(true);
    const blocked = (pending: DeparturePending) => Number(pending.aPagar)>0 || Number(pending.aReceber)>0 || Number(pending.pagamentosEmAnalise)>0 || Number(pending.parcelamentosEmAnalise)>0;
    try {
      const pending = await residenciaUsuarioService.pending(residencia.id, usuarioId);
      if (blocked(pending)) { setBlocker({ name, own, pending }); setLeaving(false); return; }
      Alert.alert(own ? 'Sair da residência?' : `Remover ${name}?`, own
        ? 'Você está prestes a sair desta residência. Seus registros serão preservados para quem continuar na casa, mas você perderá o acesso à residência anterior, inclusive ao histórico e aos comprovantes. Deseja continuar?'
        : 'O morador perderá o acesso à casa. Todos os registros financeiros serão preservados. Deseja continuar?', [
        { text: 'Cancelar', style: 'cancel', onPress: () => setLeaving(false) },
        { text: own ? 'Confirmar saída' : 'Confirmar remoção', style: 'destructive', onPress: async () => {
          try {
            const result = await residenciaUsuarioService.depart(residencia.id, usuarioId);
            if (!result.ok) { setBlocker({ name, own, pending: result.pendencias }); return; }
            if (own) {
              session.setResidencia(null);
              setResidents([]); setResidencia(null);
              router.replace('/join-house');
            } else await loadHouse();
          } catch (error: any) { Alert.alert('Não foi possível concluir', getApiErrorMessage(error, 'Tente novamente.')); }
          finally { setLeaving(false); }
        } },
      ], { cancelable: true, onDismiss: () => setLeaving(false) });
    } catch (error: any) { setLeaving(false); Alert.alert('Não foi possível verificar', getApiErrorMessage(error, 'Confira a conexão e tente novamente.')); }
  };
  const handleLeave = () => {
    const user = session.getUser();
    if (user && canLeave) void requestDeparture(user.id, user.nome, true);
  };
  const handleDelete = (id: string, name: string) => {
    const resident = residents.find(item => item.id === id);
    if (resident && canManage) void requestDeparture(resident.usuarioId, name, false);
  };

  return { router, residents, residencia, loading, canManage, canLeave, leaving, blocker, setBlocker, handleLeave, handleCopyCode, handleDelete };
}
