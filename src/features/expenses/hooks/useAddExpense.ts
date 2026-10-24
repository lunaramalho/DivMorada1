import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { appAlert as Alert } from '@/components/appAlert';
import type { Person } from '../types';
import {
  despesaService,
  getApiErrorMessage,
  residenciaUsuarioService,
  usuarioService,
  type ResidenciaUsuario,
  type Usuario,
} from '@/services/api';
import { session } from '@/services/session';

const AVATAR_COLORS = ['#c0392b', '#2980b9', '#1abc9c', '#8e44ad', '#e67e22'];

const formatCurrencyInput = (value: string) => {
  const digits = value.replace(/\D/g, '');
  const amount = Number(digits || '0') / 100;

  if (!digits) {
    return '';
  }

  return amount.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const parseCurrencyInput = (value: string) => {
  const digits = value.replace(/\D/g, '');
  return Number(digits || '0') / 100;
};

export function useAddExpense() {
  const router = useRouter();

  const [people, setPeople] = useState<Person[]>([]);
  const [expenseName, setExpenseName] = useState('');
  const [totalValue, setTotalValue] = useState('');
  const [payerId, setPayerId] = useState<string | null>(session.getUser()?.id ?? null);
  const [participants, setParticipants] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const loadPeople = useCallback(async () => {
    const residencia = session.getResidencia();

    if (!residencia) {
      setPeople([]);
      return;
    }

    try {
      const [moradores, usuarios] = await Promise.all([
        residenciaUsuarioService.list(),
        usuarioService.list(),
      ]);

      const nextPeople = moradores
        .filter((item: ResidenciaUsuario) => item.residenciaId === residencia.id && item.ativo)
        .map((morador, index) => {
          const usuario = usuarios.find((item: Usuario) => item.id === morador.usuarioId);
          const name = usuario?.nome ?? 'Morador';

          return {
            id: morador.usuarioId,
            name,
            short: name.split(' ')[0],
            avatarLetter: name.trim().charAt(0).toUpperCase() || 'M',
            avatarColor: AVATAR_COLORS[index % AVATAR_COLORS.length],
          };
        });

      setPeople(nextPeople);
      setParticipants(nextPeople.map(person => person.id));
    } catch (error: any) {
      Alert.alert('Erro', getApiErrorMessage(error, 'Nao foi possivel carregar moradores.'));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPeople();
    }, [loadPeople]),
  );

  const toggleParticipant = (id: string) => {
    setParticipants(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id],
    );
  };

  const valuePerPerson = useMemo(() => {
    const total = parseCurrencyInput(totalValue);
    if (!total || participants.length === 0) return 0;
    return total / participants.length;
  }, [totalValue, participants]);

  const handleCancel = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const handleSave = async () => {
    const residencia = session.getResidencia();
    const currentUser = session.getUser();
    const total = parseCurrencyInput(totalValue);

    if (!residencia) {
      Alert.alert('Atencao', 'Selecione ou crie uma casa antes de adicionar despesas.');
      return;
    }
    if (!expenseName.trim()) {
      Alert.alert('Atencao', 'Informe o nome da despesa.');
      return;
    }
    if (!total || total <= 0) {
      Alert.alert('Atencao', 'Informe o valor total.');
      return;
    }
    if (!payerId) {
      Alert.alert('Atencao', 'Selecione quem pagou.');
      return;
    }
    if (participants.length === 0) {
      Alert.alert('Atencao', 'Selecione os participantes.');
      return;
    }

    setLoading(true);
    try {
      await despesaService.create({
        residenciaId: residencia.id,
        criadoPorId: payerId,
        nome: expenseName.trim(),
        descricao: `Dividida entre ${participants.length} pessoa(s).`,
        valorTotal: total,
        tipo: 'VARIAVEL',
        status: 'PENDENTE',
        participantesIds: participants,
      });

      const title = 'Despesa adicionada com sucesso!';
      const message = `"${expenseName}" de R$ ${total.toFixed(2).replace('.', ',')} foi registrada.`;
      const navigateAfterSave = () => {
        if (currentUser?.id === payerId) {
          router.replace('/receivables');
          return;
        }

        if (currentUser && participants.includes(currentUser.id)) {
          router.replace('/debtors');
          return;
        }

        if (router.canGoBack()) router.back();
    else router.replace('/');
      };

      if (Platform.OS === 'web') {
        // React Native Alert does not display dialogs or run button callbacks on web.
        window.alert(`${title}\n\n${message}`);
        navigateAfterSave();
      } else {
        Alert.alert(title, message, [{ text: 'OK', onPress: navigateAfterSave }]);
      }
    } catch (error: any) {
      Alert.alert('Erro ao salvar', getApiErrorMessage(error, 'Nao foi possivel salvar a despesa.'));
    } finally {
      setLoading(false);
    }
  };

  const handleChangeTotalValue = (value: string) => {
    setTotalValue(formatCurrencyInput(value));
  };

  return {
    people, expenseName, totalValue, payerId, participants, loading,
    valuePerPerson, setExpenseName, setPayerId, toggleParticipant,
    handleCancel, handleSave, handleChangeTotalValue,
  };
}
