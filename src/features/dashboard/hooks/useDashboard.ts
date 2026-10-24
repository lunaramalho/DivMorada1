import { useCallback, useState } from 'react';
import { appAlert as Alert } from '@/components/appAlert';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  getApiErrorMessage,
  historicoService,
  resumoFinanceiroService,
  type Historico,
  type ResumoFinanceiro,
} from '@/services/api';
import { session } from '@/services/session';

export function useDashboard() {
  const router = useRouter();
  const [summary, setSummary] = useState<ResumoFinanceiro>({
    voceDeve: 0,
    teDevem: 0,
    saldoLiquido: 0,
  });
  const [historicos, setHistoricos] = useState<Historico[]>([]);
  const [loading, setLoading] = useState(false);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const residencia = session.getResidencia();
      const user = session.getUser();
      const historicosData = await historicoService.list();

      if (residencia && user) {
        const resumo = await resumoFinanceiroService.get(user.id, residencia.id);
        setSummary(resumo);
      } else {
        setSummary({
          voceDeve: 0,
          teDevem: 0,
          saldoLiquido: 0,
        });
      }

      setHistoricos(
        residencia
          ? historicosData.filter(item => item.residenciaId === residencia.id)
          : historicosData,
      );
    } catch (error: any) {
      Alert.alert('Erro', getApiErrorMessage(error, 'Nao foi possivel carregar o resumo.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [loadDashboard]),
  );

  const recentActivities = historicos.slice(0, 3);

  return { router, summary, recentActivities, loading };
}
