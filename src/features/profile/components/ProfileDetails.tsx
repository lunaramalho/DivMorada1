import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { useProfile } from '../hooks/useProfile';

type Props = Pick<ReturnType<typeof useProfile>,
  | 'name'
  | 'email'
  | 'modality'
  | 'editName'
  | 'setName'
  | 'setEditName'
>;

export function ProfileDetails({
  name,
  email,
  modality,
  editName,
  setName,
  setEditName,
}: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.fieldRow}>
        <MaterialCommunityIcons name="account-outline" size={20} color="#888" />
        <View style={styles.fieldContent}>
          <Text style={styles.fieldLabel}>Nome:</Text>
          {editName ? (
            <TextInput
              style={styles.fieldInput}
              value={name}
              onChangeText={setName}
              autoFocus
            />
          ) : (
            <Text style={styles.fieldValue}>{name || 'Usuario'}</Text>
          )}
        </View>
        <TouchableOpacity onPress={() => setEditName(true)}>
          <MaterialCommunityIcons name="pencil-outline" size={20} color="#1abc9c" />
        </TouchableOpacity>
      </View>

      <View style={styles.separator} />

      <View style={styles.fieldRow}>
        <MaterialCommunityIcons name="email-outline" size={20} color="#888" />
        <View style={styles.fieldContent}>
          <Text style={styles.fieldLabel}>E-mail:</Text>
          <Text style={styles.fieldValue}>{email || 'Sem email'}</Text>
        </View>
      </View>

      <View style={styles.separator} />

      <View style={styles.fieldRow}>
        <MaterialCommunityIcons name="account-group-outline" size={20} color="#888" />
        <View style={styles.fieldContent}>
          <Text style={styles.fieldLabel}>Modalidade</Text>
          <View style={styles.modalityRow}>
            <Text style={[styles.modalityText, modality === 'Administrador' && styles.modalityActive]}>
              Administrador {modality === 'Administrador' ? '✓' : ''}
            </Text>
            <Text style={[styles.modalityText, modality === 'Morador' && styles.modalityActive]}>
              Morador {modality === 'Morador' ? '✓' : ''}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff', borderRadius: 16,
    width: '100%', padding: 4,
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07, shadowRadius: 4,
    marginBottom: 16,
  },
  separator: { height: 1, backgroundColor: '#f0f0f0', marginHorizontal: 16 },

  fieldRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 16, gap: 10,
  },
  fieldContent: { flex: 1 },
  fieldLabel: { fontSize: 11, color: '#aaa', fontWeight: '600', marginBottom: 2 },
  fieldValue: { fontSize: 15, color: '#222', fontWeight: '600' },
  fieldInput: {
    fontSize: 15, color: '#222', fontWeight: '600',
    borderBottomWidth: 1.5, borderColor: '#1abc9c', paddingVertical: 2,
  },

  modalityRow: { flexDirection: 'row', gap: 20, marginTop: 4 },
  modalityText: { fontSize: 14, color: '#aaa', fontWeight: '600' },
  modalityActive: { color: '#1abc9c' },
});
