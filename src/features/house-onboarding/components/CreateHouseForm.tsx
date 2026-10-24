import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

type Props = { houseName: string; onChangeHouseName: (value: string) => void; loading: boolean; onCreate: () => void };

export function CreateHouseForm({ houseName, onChangeHouseName, loading, onCreate }: Props) {
  return (
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
          onChangeText={onChangeHouseName}
        />
      </View>
      <TouchableOpacity
        style={[styles.btnPrimary, loading && styles.btnPrimaryDisabled]}
        onPress={onCreate}
        disabled={loading}
      >
        <Text style={styles.btnPrimaryText}>
          {loading ? 'Criando...' : 'Criar Casa'}
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
});
