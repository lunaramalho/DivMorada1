import * as DocumentPicker from 'expo-document-picker';
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
import { getApiErrorMessage, pagamentoService, uploadService, type Pagamento } from '@/services/api';
import { session } from '@/services/session';

type DebtPayment = Pagamento & {
  despesa?: {
    id: string;
    nome: string;
    descricao?: string | null;
    criadoPorId: string;
    criadoPor?: {
      id: string;
      nome: string;
      email: string;
    };
  } | null;
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

export default function DebtorsScreen() {
  const router = useRouter();
  const [debts, setDebts] = useState<DebtPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadDebts = useCallback(async () => {
    const user = session.getUser();
    const residencia = session.getResidencia();

    if (!user || !residencia) {
      setDebts([]);
      setLoading(false);
      return;
    }

    try {
      const pagamentos = await pagamentoService.list({
        residenciaId: residencia.id,
        usuarioId: user.id,
        status: 'PENDENTE',
      });

      setDebts(
        (pagamentos as DebtPayment[]).filter(
          pagamento => pagamento.despesa?.criadoPorId && pagamento.despesa.criadoPorId !== user.id,
        ),
      );
    } catch (error: any) {
      Alert.alert(
        'Erro ao carregar dividas',
        getApiErrorMessage(error, 'Nao foi possivel carregar suas dividas.'),
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadDebts();
    }, [loadDebts]),
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadDebts();
  };

  const confirmPayment = (payment: DebtPayment, comprovanteUrl?: string) => {
    const creditorName = payment.despesa?.criadoPor?.nome ?? 'morador';

    Alert.alert('Pagar', `Confirmar pagamento para ${creditorName}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Confirmar',
        onPress: async () => {
          setUpdatingId(payment.id);
          try {
            await pagamentoService.update(payment.id, {
              status: 'CONFIRMADO',
              comprovanteUrl,
              pagoEm: new Date().toISOString(),
            });
            await loadDebts();
            Alert.alert('Pronto', 'Pagamento marcado como confirmado.');
          } catch (error: any) {
            Alert.alert(
              'Erro ao pagar',
              getApiErrorMessage(error, 'Nao foi possivel atualizar o pagamento.'),
            );
          } finally {
            setUpdatingId(null);
          }
        },
      },
    ]);
  };

  const handleAttach = async (payment: DebtPayment) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      setUpdatingId(payment.id);
      const file = result.assets[0];
      const upload = await uploadService.comprovante({
        uri: file.uri,
        name: file.name,
        mimeType: file.mimeType,
      });

      confirmPayment(payment, upload.url);
    } catch (error: any) {
      Alert.alert(
        'Erro ao anexar',
        getApiErrorMessage(error, 'Nao foi possivel enviar o comprovante.'),
      );
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backArrow}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.logo}>Casa <Text style={styles.brand}>DivMorada</Text></Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>Dividas a Pagar</Text>

        {loading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator color="#1abc9c" />
            <Text style={styles.stateText}>Carregando dividas...</Text>
          </View>
        ) : debts.length === 0 ? (
          <View style={styles.stateBox}>
            <Text style={styles.emptyTitle}>Nenhuma divida pendente</Text>
            <Text style={styles.stateText}>Quando voce tiver pagamentos pendentes, eles aparecem aqui.</Text>
          </View>
        ) : (
          debts.map(payment => {
            const creditorName = payment.despesa?.criadoPor?.nome ?? 'Morador';
            const category = payment.despesa?.nome ?? 'Despesa';
            const isUpdating = updatingId === payment.id;

            return (
              <View key={payment.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={[styles.avatar, { backgroundColor: getAvatarColor(creditorName) }]}>
                    <Text style={styles.avatarText}>{creditorName.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={styles.info}>
                    <Text style={styles.name}>{creditorName}</Text>
                    <Text style={styles.category}>{category}</Text>
                  </View>
                  <Text style={styles.amount}>{formatCurrency(payment.valor)}</Text>
                </View>

                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[styles.btnPay, isUpdating && styles.btnDisabled]}
                    onPress={() => confirmPayment(payment)}
                    disabled={isUpdating}
                  >
                    <Text style={styles.btnPayText}>{isUpdating ? 'Salvando...' : 'Pagar Agora'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.btnAttach, isUpdating && styles.btnDisabled]}
                    onPress={() => handleAttach(payment)}
                    disabled={isUpdating}
                  >
                    <Text style={styles.btnAttachText}>Anexar Comprovante</Text>
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
    paddingBottom: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  backBtn: { marginRight: 10, padding: 4 },
  backArrow: { fontSize: 24, color: '#1abc9c', lineHeight: 28 },
  logo: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  brand: { color: '#1abc9c' },

  content: { padding: 16, paddingBottom: 32 },
  pageTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 18 },
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
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700', color: '#222' },
  category: { fontSize: 12, color: '#888', marginTop: 2 },
  amount: { fontSize: 16, fontWeight: 'bold', color: '#222' },

  actions: { flexDirection: 'row', gap: 10 },
  btnPay: {
    backgroundColor: '#1abc9c',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  btnPayText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  btnAttach: {
    borderWidth: 1,
    borderColor: '#ccc',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  btnAttachText: { color: '#555', fontSize: 13 },
  btnDisabled: { opacity: 0.6 },
});
