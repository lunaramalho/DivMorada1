import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AvatarContent } from '@/components/AvatarContent';
import type { Resident } from '../types';

type Props = {
  resident: Resident;
  canManage: boolean;
  onConfirm: (id: string) => void;
  onDelete: (id: string, name: string) => void;
};

export function HouseResidentRow({ resident, canManage, onConfirm, onDelete }: Props) {
  return (
    <View style={styles.residentRow}>
      <View style={[styles.avatar, { backgroundColor: resident.avatarColor }]}>
        <AvatarContent
          photoUri={resident.photoUri}
          initial={resident.avatarLetter}
          textStyle={styles.avatarText}
        />
      </View>

      <View style={styles.residentInfo}>
        <Text style={styles.residentName}>{resident.name}</Text>
        <Text style={[
          styles.residentRole,
          resident.role === 'Administrador' && styles.roleAdmin,
        ]}>{resident.role}</Text>
      </View>

      {canManage && resident.role !== 'Administrador' && <View style={styles.residentActions}>
        {!resident.confirmed ? (
          <TouchableOpacity
            style={styles.btnConfirm}
            onPress={() => onConfirm(resident.id)}
          >
            <Text style={styles.btnConfirmText}>Confirmar Novo</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => onDelete(resident.id, resident.name)}
          >
            <MaterialCommunityIcons name="trash-can-outline" size={20} color="#e74c3c" />
          </TouchableOpacity>
        )}
      </View>}
    </View>
  );
}

const styles = StyleSheet.create({
  residentRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 12,
    padding: 12, marginBottom: 10,
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 3,
  },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', marginRight: 12, overflow: 'hidden' },
  avatarText: { color: '#fff', fontWeight: 'bold', fontSize: 17 },
  residentInfo: { flex: 1 },
  residentName: { fontSize: 15, fontWeight: '700', color: '#222' },
  residentRole: { fontSize: 12, color: '#888', marginTop: 2 },
  roleAdmin: { color: '#1abc9c', fontWeight: '600' },

  residentActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconBtn: { padding: 6 },

  btnConfirm: { backgroundColor: '#1abc9c', borderRadius: 8, paddingVertical: 7, paddingHorizontal: 12 },
  btnConfirmText: { color: '#fff', fontWeight: '700', fontSize: 12 },
});
