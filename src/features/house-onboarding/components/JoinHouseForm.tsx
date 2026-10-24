import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

type Props = { code: string; onChangeCode: (value: string) => void; loading: boolean; onJoin: () => void };

export function JoinHouseForm({ code, onChangeCode, loading, onJoin }: Props) {
  return (
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
          onChangeText={text => onChangeCode(text.toUpperCase())}
          autoCapitalize="characters"
          maxLength={8}
        />
      </View>
      <TouchableOpacity
        style={[styles.btnPrimary, loading && styles.btnPrimaryDisabled]}
        onPress={onJoin}
        disabled={loading}
      >
        <Text style={styles.btnPrimaryText}>
          {loading ? 'Entrando...' : 'Entrar na Casa'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
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

  btnPrimary: {
    backgroundColor: '#1abc9c', borderRadius: 12,
    paddingVertical: 16, alignItems: 'center',
  },
  btnPrimaryDisabled: { opacity: 0.7 },
  btnPrimaryText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});
