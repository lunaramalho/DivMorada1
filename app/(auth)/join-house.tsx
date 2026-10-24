import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  residenciaService,
  residenciaUsuarioService,
  getApiErrorMessage,
  type Residencia,
} from '@/services/api';
import { session } from '@/services/session';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type Tab = 'join' | 'create';

export default function JoinHouseScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('join');
  const [code, setCode] = useState('');
  const [houseName, setHouseName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
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
      const residencia = await residenciaService.getByCodigo(code.trim().toUpperCase());
      await residenciaUsuarioService.create(residencia.id, user.id, 'membro');
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
      await residenciaService.create(houseName.trim());
      const residencias = await residenciaService.list();
      const residencia = residencias
        .filter(item => item.nome === houseName.trim())
        .sort((a, b) => new Date(b.createdAt ?? '').getTime() - new Date(a.createdAt ?? '').getTime())[0] as Residencia | undefined;

      if (!residencia) {
        throw new Error('Residencia criada, mas nao encontrada na listagem.');
      }

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

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.logoRow}>
            <Text style={styles.logo}>Casa <Text style={styles.brand}>DivMorada</Text></Text>
          </View>

          <View style={styles.iconWrap}>
            <MaterialCommunityIcons name="home-group" size={72} color="#1abc9c" />
          </View>

          <Text style={styles.title}>Bem-vindo ao DivMorada!</Text>
          <Text style={styles.subtitle}>
            Para comecar, entre em uma casa existente usando o codigo de convite, ou crie uma nova casa.
          </Text>

          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tabBtn, tab === 'join' && styles.tabBtnActive]}
              onPress={() => setTab('join')}
            >
              <Text style={[styles.tabText, tab === 'join' && styles.tabTextActive]}>
                Entrar em uma Casa
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, tab === 'create' && styles.tabBtnActive]}
              onPress={() => setTab('create')}
            >
              <Text style={[styles.tabText, tab === 'create' && styles.tabTextActive]}>
                Criar Nova Casa
              </Text>
            </TouchableOpacity>
          </View>

          {tab === 'join' ? (
            <View style={styles.card}>
              <View style={styles.cardIconRow}>
                <MaterialCommunityIcons name="key-variant" size={28} color="#1abc9c" />
                <Text style={styles.cardTitle}>Codigo de Convite</Text>
              </View>
              <Text style={styles.cardDesc}>
                Peca o codigo ao administrador da casa e cole abaixo.
              </Text>
              <View style={styles.codeInputRow}>
                <TextInput
                  style={styles.codeInput}
                  placeholder="Ex: R7XY39"
                  placeholderTextColor="#bbb"
                  value={code}
                  onChangeText={text => setCode(text.toUpperCase())}
                  autoCapitalize="characters"
                  maxLength={8}
                />
              </View>
              <TouchableOpacity
                style={[styles.btnPrimary, loading && styles.btnPrimaryDisabled]}
                onPress={handleJoin}
                disabled={loading}
              >
                <Text style={styles.btnPrimaryText}>
                  {loading ? 'Entrando...' : 'Entrar na Casa'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.card}>
              <View style={styles.cardIconRow}>
                <MaterialCommunityIcons name="home-plus-outline" size={28} color="#1abc9c" />
                <Text style={styles.cardTitle}>Nova Casa</Text>
              </View>
              <Text style={styles.cardDesc}>
                Voce sera o administrador e podera compartilhar o codigo com os moradores.
              </Text>
              <View style={styles.inputWrap}>
                <MaterialCommunityIcons name="home-outline" size={20} color="#aaa" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.nameInput}
                  placeholder="Nome da casa"
                  placeholderTextColor="#bbb"
                  value={houseName}
                  onChangeText={setHouseName}
                />
              </View>
              <TouchableOpacity
                style={[styles.btnPrimary, loading && styles.btnPrimaryDisabled]}
                onPress={handleCreate}
                disabled={loading}
              >
                <Text style={styles.btnPrimaryText}>
                  {loading ? 'Criando...' : 'Criar Casa'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity style={styles.btnBack} onPress={() => router.back()}>
            <Text style={styles.btnBackText}>Voltar para o Login</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f4f6f5' },
  content: { padding: 24, paddingBottom: 48, alignItems: 'center' },

  logoRow: { width: '100%', marginBottom: 8 },
  logo: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  brand: { color: '#1abc9c' },

  iconWrap: { marginTop: 16, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#222', textAlign: 'center', marginBottom: 10 },
  subtitle: { fontSize: 14, color: '#777', textAlign: 'center', lineHeight: 20, marginBottom: 28, paddingHorizontal: 8 },

  tabRow: {
    flexDirection: 'row', width: '100%',
    backgroundColor: '#e8f8f5', borderRadius: 12,
    padding: 4, marginBottom: 20,
  },
  tabBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
  },
  tabBtnActive: { backgroundColor: '#1abc9c' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#888' },
  tabTextActive: { color: '#fff' },

  card: {
    width: '100%', backgroundColor: '#fff',
    borderRadius: 16, padding: 20,
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07, shadowRadius: 6,
    marginBottom: 20,
  },
  cardIconRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  cardTitle: { fontSize: 17, fontWeight: 'bold', color: '#222' },
  cardDesc: { fontSize: 13, color: '#888', lineHeight: 18, marginBottom: 18 },

  codeInputRow: {
    borderWidth: 2, borderColor: '#1abc9c', borderRadius: 12,
    marginBottom: 18, paddingHorizontal: 16,
  },
  codeInput: {
    height: 52, fontSize: 26, fontWeight: 'bold',
    color: '#222', textAlign: 'center', letterSpacing: 6,
  },

  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#ddd', borderRadius: 12,
    paddingHorizontal: 14, marginBottom: 18, backgroundColor: '#fafafa',
  },
  nameInput: { flex: 1, height: 48, fontSize: 14, color: '#333' },

  btnPrimary: {
    backgroundColor: '#1abc9c', borderRadius: 12,
    paddingVertical: 16, alignItems: 'center',
  },
  btnPrimaryDisabled: { opacity: 0.7 },
  btnPrimaryText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },

  btnBack: { marginTop: 8 },
  btnBackText: { color: '#888', fontSize: 14 },
});
