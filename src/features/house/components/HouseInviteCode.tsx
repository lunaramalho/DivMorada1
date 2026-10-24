import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Props = { code: string; onCopy: () => void };

export function HouseInviteCode({ code, onCopy }: Props) {
  return (
    <View style={styles.inviteSection}>
      <Text style={styles.inviteLabel}>CODIGO DE CONVITE:</Text>
      <TouchableOpacity style={styles.inviteCodeRow} onPress={onCopy}>
        <Text style={styles.inviteCode}>{code}</Text>
        <MaterialCommunityIcons name="content-copy" size={18} color="#555" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  inviteSection: { flexDirection: 'row', alignItems: 'center', marginTop: 22, marginBottom: 12, gap: 8 },
  inviteLabel: { fontWeight: '700', color: '#444', fontSize: 13 },
  inviteCodeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#eee', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12 },
  inviteCode: { fontWeight: 'bold', fontSize: 16, color: '#222', letterSpacing: 2 },
});
