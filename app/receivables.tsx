import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { getApiErrorMessage, notificacaoService, pagamentoService, type Pagamento } from '@/services/api';
import { session } from '@/services/session';

type ReceivablePayment = Pagamento & {
  despesa?: {
    id: string;
    nome: string;
    descricao?: string | null;
    criadoPorId: string;
  } | null;
  usuario?: {
    id: string;
    nome: string;
    email: string;
  };
};

const avatarColors = ['#c0392b', '#2980b9', '#1abc9c', '#8e44ad', '#d35400', '#16a085'];

const formatCurrency = (value: string | number) =>
  Number(value).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

const getAvatarColor = (id: string) => {
  const sum = id.split('').reduce((total, char) => total + char.charCodeAt(0), 0);
  return avatarColors[sum % avatarColors.length];
};

export default function ReceivablesScreen() {
  const router = useRouter();
  const [receivables, setReceivables] = useState<ReceivablePayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [sendingChargeId, setSendingChargeId] = useState<string | null>(null);

  const loadReceivables = useCallback(async () => {
    const user = session.getUser();
    const residencia = session.getResidencia();

    if (!user || !residencia) {
      setReceivables([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const pagamentos = await pagamentoService.list({
        residenciaId: residencia.id,
        status: 'PENDENTE',
      });

      setReceivables(
        (pagamentos as ReceivablePayment[]).filter(
          pagamento => pagamento.usuarioId !== user.id && pagamento.despesa?.criadoPorId === user.id,
        ),
      );
    } catch (error: any) {
      Alert.alert(
        'Erro ao carregar recebiveis',
        getApiErrorMessage(error, 'Nao foi possivel carregar quem te deve.'),
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadReceivables();
    }, [loadReceivables]),
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadReceivables();
  };

  const handleMarkPaid = (payment: ReceivablePayment) => {
    const debtorName = payment.usuario?.nome ?? 'morador';

    Alert.alert('Confirmar', `Marcar pagamento de ${debtorName} como recebido?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Confirmar',
        onPress: async () => {
          setUpdatingId(payment.id);
          try {
            await pagamentoService.update(payment.id, {
              status: 'CONFIRMADO',
              pagoEm: new Date().toISOString(),
            });
            await loadReceivables();
            Alert.alert('Pronto', 'Pagamento marcado como recebido.');
          } catch (error: any) {
            Alert.alert(
              'Erro ao atualizar',
              getApiErrorMessage(error, 'Nao foi possivel marcar como recebido.'),
            );
          } finally {
            setUpdatingId(null);
          }
        },
      },
    ]);
  };

  const handleSendCharge = async (payment: ReceivablePayment) => {
    try {
      setSendingChargeId(payment.id);
      await notificacaoService.enviarCobranca(payment.id);
      Alert.alert('Cobranca enviada', 'O e-mail de cobranca foi enviado para o morador.');
    } catch (error: any) {
      Alert.alert(
        'Erro ao enviar cobranca',
        getApiErrorMessage(error, 'Nao foi possivel enviar a cobranca por e-mail.'),
      );
    } finally {
      setSendingChargeId(null);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backArrow}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Casa <Text style={styles.brand}>DivMorada</Text></Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>Recebiveis</Text>

        {loading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator color="#1abc9c" />
            <Text style={styles.stateText}>Carregando recebiveis...</Text>
          </View>
        ) : receivables.length === 0 ? (
          <View style={styles.stateBox}>
            <Text style={styles.emptyTitle}>Ninguem te deve no momento</Text>
            <Text style={styles.stateText}>Quando houver pagamentos pendentes para voce, eles aparecem aqui.</Text>
          </View>
        ) : (
          receivables.map(item => {
            const debtorName = item.usuario?.nome ?? 'Morador';
            const category = item.despesa?.nome ?? 'Despesa';
            const isUpdating = updatingId === item.id;
            const isSendingCharge = sendingChargeId === item.id;

            return (
              <View key={item.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={[styles.avatar, { backgroundColor: getAvatarColor(debtorName) }]}>
                    <Text style={styles.avatarText}>{debtorName.charAt(0).toUpperCase()}</Text>
                  </View>

                  <View style={styles.info}>
                    <Text style={styles.name}>{debtorName}</Text>
                    <Text style={styles.category}>{category}</Text>
                  </View>

                  <Text style={styles.amount}>{formatCurrency(item.valor)}</Text>
                </View>

                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.btnMark, isUpdating && styles.btnDisabled]}
                    onPress={() => handleMarkPaid(item)}
                    disabled={isUpdating}
                  >
                    <Text style={styles.btnMarkText}>{isUpdating ? 'Salvando...' : 'Marcar como Pago'}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.btnCharge, (isUpdating || isSendingCharge) && styles.btnDisabled]}
                    onPress={() => handleSendCharge(item)}
                    disabled={isUpdating || isSendingCharge}
                  >
                    <Text style={styles.btnChargeText}>{isSendingCharge ? 'Enviando...' : 'Enviar Cobranca'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f4f6f5' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  backBtn: { marginRight: 10, padding: 4 },
  backArrow: { fontSize: 24, color: '#1abc9c', lineHeight: 28 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  brand: { color: '#1abc9c' },

  content: { padding: 16, paddingBottom: 32 },
  pageTitle: { fontSize: 20, fontWeight: '700', color: '#1abc9c', marginBottom: 18 },
  stateBox: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    gap: 10,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#222' },
  stateText: { fontSize: 13, color: '#777', textAlign: 'center' },

  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  info: { flex: 1, paddingRight: 8 },
  name: { fontSize: 15, fontWeight: '700', color: '#222' },
  category: { fontSize: 12, color: '#888', marginTop: 2 },
  amount: { fontSize: 16, fontWeight: 'bold', color: '#222' },

  actions: { alignItems: 'flex-start', gap: 8 },
  actionButton: {
    minWidth: 150,
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  btnMark: { backgroundColor: '#1abc9c' },
  btnMarkText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  btnCharge: { backgroundColor: '#2980b9' },
  btnChargeText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  btnDisabled: { opacity: 0.6 },
});
