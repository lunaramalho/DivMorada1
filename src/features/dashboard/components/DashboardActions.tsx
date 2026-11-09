import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Props = { onReceivables: () => void; onDebts: () => void; onConfirmations: () => void };

export function DashboardActions({ onReceivables, onDebts, onConfirmations }: Props) {
  return (
    <View>
    <View style={styles.buttonRow}>
      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: '#2ecc71' }]}
        onPress={onReceivables}
      >
        <MaterialCommunityIcons name="arrow-down-circle-outline" size={20} color="#fff" />
        <Text style={styles.buttonText}>Quem Me Deve</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: '#e74c3c' }]}
        onPress={onDebts}
      >
        <MaterialCommunityIcons name="arrow-up-circle-outline" size={20} color="#fff" />
        <Text style={styles.buttonText}>A Pagar</Text>
      </TouchableOpacity>
    </View>
    <TouchableOpacity accessibilityRole="button" style={styles.confirmations} onPress={onConfirmations}>
      <MaterialCommunityIcons name="clipboard-check-outline" size={22} color="#168f78" />
      <Text style={styles.confirmationsText}>Confirmações</Text>
    </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
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
  confirmations: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: '#b9e5d8', borderRadius: 12, padding: 14, marginTop: 12 },
  confirmationsText: { color: '#168f78', fontWeight: '700', fontSize: 14 },
});
