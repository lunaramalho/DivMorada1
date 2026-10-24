import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
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

type Resident = {
  id: string;
  name: string;
  role: 'Administrador' | 'Membro';
  avatarLetter: string;
  avatarColor: string;
  photoUri?: string | null;
  confirmed: boolean;
};

const AVATAR_COLORS = ['#c0392b', '#2980b9', '#1abc9c', '#8e44ad', '#e67e22'];

export default function HouseScreen() {
  const router = useRouter();
  const [residents, setResidents] = useState<Resident[]>([]);
  const [residencia, setResidencia] = useState<Residencia | null>(session.getResidencia());
  const [loading, setLoading] = useState(false);

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

    await Clipboard.setStringAsync(residencia.codigo);
    Alert.alert('Copiado!', `Codigo ${residencia.codigo} copiado.`);
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

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.logo}>Casa <Text style={styles.brand}>DivMorada</Text></Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Moradores da Casa</Text>

        <View style={styles.houseNameBadge}>
          <Text style={styles.houseNameText}>
            {residencia ? residencia.nome.toUpperCase() : 'NENHUMA CASA SELECIONADA'}
          </Text>
        </View>

        {loading && <Text style={styles.emptyText}>Carregando moradores...</Text>}

        {!loading && residents.length === 0 && (
          <Text style={styles.emptyText}>Nenhum morador cadastrado nesta casa.</Text>
        )}

        {residents.map(r => (
          <View key={r.id} style={styles.residentRow}>
            <View style={[styles.avatar, { backgroundColor: r.avatarColor }]}>
              {r.photoUri ? (
                <Image source={{ uri: r.photoUri }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>{r.avatarLetter}</Text>
              )}
            </View>

            <View style={styles.residentInfo}>
              <Text style={styles.residentName}>{r.name}</Text>
              <Text style={[
                styles.residentRole,
                r.role === 'Administrador' && styles.roleAdmin,
              ]}>{r.role}</Text>
            </View>

            <View style={styles.residentActions}>
              {!r.confirmed ? (
                <TouchableOpacity
                  style={styles.btnConfirm}
                  onPress={() => handleConfirm(r.id)}
                >
                  <Text style={styles.btnConfirmText}>Confirmar Novo</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={() => handleDelete(r.id, r.name)}
                >
                  <MaterialCommunityIcons name="trash-can-outline" size={20} color="#e74c3c" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}

        {residencia && (
          <View style={styles.inviteSection}>
            <Text style={styles.inviteLabel}>CODIGO DE CONVITE:</Text>
            <TouchableOpacity style={styles.inviteCodeRow} onPress={handleCopyCode}>
              <Text style={styles.inviteCode}>{residencia.codigo}</Text>
              <MaterialCommunityIcons name="content-copy" size={18} color="#555" />
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={styles.btnAddExpense}
          onPress={() => router.push('/add-expense')}
        >
          <Text style={styles.btnAddExpenseText}>Adicionar Nova Despesa </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f4f6f5' },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' },
  logo: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  brand: { color: '#1abc9c' },

  content: { padding: 20, paddingBottom: 40 },
  pageTitle: { fontSize: 22, fontWeight: 'bold', color: '#222', marginBottom: 14 },

  houseNameBadge: {
    borderWidth: 1, borderColor: '#ccc', borderRadius: 6,
    paddingVertical: 8, paddingHorizontal: 14,
    alignSelf: 'flex-start', marginBottom: 20,
  },
  houseNameText: { fontWeight: '700', color: '#333', fontSize: 13, letterSpacing: 0.5 },
  emptyText: { color: '#888', marginBottom: 14 },

  residentRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 12,
    padding: 12, marginBottom: 10,
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 3,
  },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', marginRight: 12, overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%' },
  avatarText: { color: '#fff', fontWeight: 'bold', fontSize: 17 },
  residentInfo: { flex: 1 },
  residentName: { fontSize: 15, fontWeight: '700', color: '#222' },
  residentRole: { fontSize: 12, color: '#888', marginTop: 2 },
  roleAdmin: { color: '#1abc9c', fontWeight: '600' },

  residentActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconBtn: { padding: 6 },

  btnConfirm: { backgroundColor: '#1abc9c', borderRadius: 8, paddingVertical: 7, paddingHorizontal: 12 },
  btnConfirmText: { color: '#fff', fontWeight: '700', fontSize: 12 },

  inviteSection: { flexDirection: 'row', alignItems: 'center', marginTop: 22, marginBottom: 12, gap: 8 },
  inviteLabel: { fontWeight: '700', color: '#444', fontSize: 13 },
  inviteCodeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#eee', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12 },
  inviteCode: { fontWeight: 'bold', fontSize: 16, color: '#222', letterSpacing: 2 },

  btnAddExpense: {
    backgroundColor: '#1abc9c', borderRadius: 14,
    paddingVertical: 18, alignItems: 'center',
  },
  btnAddExpenseText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
