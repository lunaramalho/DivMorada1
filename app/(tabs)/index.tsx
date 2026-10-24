import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  getApiErrorMessage,
  historicoService,
  resumoFinanceiroService,
  type Historico,
  type ResumoFinanceiro,
} from '@/services/api';
import { session } from '@/services/session';

const formatCurrency = (value: number) =>
  `R$ ${value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function HomeScreen() {
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
  const saldoColor =
    summary.saldoLiquido > 0
      ? styles.balancePositive
      : summary.saldoLiquido < 0
        ? styles.balanceNegative
        : styles.balanceNeutral;
  const saldoPrefix =
    summary.saldoLiquido > 0 ? '+ ' : summary.saldoLiquido < 0 ? '- ' : '';

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Casa DivMorada</Text>
      </View>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Seu Saldo Liquido</Text>
        <Text style={[
          styles.balanceValue,
          saldoColor,
        ]}>
          {saldoPrefix}
          {formatCurrency(Math.abs(summary.saldoLiquido))}
        </Text>
        <View style={styles.divider} />
        <View style={styles.row}>
          <View style={styles.infoBox}>
            <View style={[styles.dot, { backgroundColor: '#ff4d4d' }]} />
            <Text style={styles.subValue}>- {formatCurrency(summary.voceDeve)}</Text>
            <Text style={styles.subLabel}>Voce deve</Text>
          </View>
          <View style={styles.infoBox}>
            <View style={[styles.dot, { backgroundColor: '#2ecc71' }]} />
            <Text style={styles.subValue}>+ {formatCurrency(summary.teDevem)}</Text>
            <Text style={styles.subLabel}>Te devem</Text>
          </View>
        </View>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#2ecc71' }]}
          onPress={() => router.push('/receivables')}
        >
          <MaterialCommunityIcons name="arrow-down-circle-outline" size={20} color="#fff" />
          <Text style={styles.buttonText}>Quem Me Deve</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#e74c3c' }]}
          onPress={() => router.push('/debtors')}
        >
          <MaterialCommunityIcons name="arrow-up-circle-outline" size={20} color="#fff" />
          <Text style={styles.buttonText}>A Pagar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.activitySection}>
        <Text style={styles.sectionTitle}>Atividades Recentes</Text>
        {loading && <Text style={styles.emptyText}>Carregando atividades...</Text>}
        {!loading && recentActivities.length === 0 && (
          <Text style={styles.emptyText}>Nenhuma atividade recente.</Text>
        )}
        {recentActivities.map(item => (
          <View key={item.id} style={styles.activityItem}>
            <View style={[styles.iconCircle, { backgroundColor: '#5D6D7E' }]}>
              <MaterialCommunityIcons name="history" size={24} color="white" />
            </View>
            <View>
              <Text style={styles.activityText}>{item.acao}</Text>
              <Text style={styles.activitySubtext}>{item.descricao || 'Sem descricao'}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9f9', padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, marginTop: 40 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1abc9c' },

  balanceCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
  },
  balanceLabel: { color: '#7f8c8d', fontSize: 16 },
  balanceValue: { fontSize: 32, fontWeight: 'bold', marginVertical: 10 },
  balancePositive: { color: '#1abc9c' },
  balanceNegative: { color: '#e74c3c' },
  balanceNeutral: { color: '#7f8c8d' },
  divider: { height: 1, backgroundColor: '#ecf0f1', width: '100%', marginVertical: 15 },
  row: { flexDirection: 'row', justifyContent: 'space-around', width: '100%' },
  infoBox: { alignItems: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5, marginBottom: 5 },
  subValue: { fontWeight: 'bold', fontSize: 16 },
  subLabel: { color: '#7f8c8d', fontSize: 12 },

  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, gap: 12 },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 14 },

  activitySection: { marginTop: 30 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  activityItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  iconCircle: { width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  activityText: { fontSize: 16, fontWeight: '600' },
  activitySubtext: { color: '#7f8c8d' },
  emptyText: { color: '#7f8c8d' },
});
