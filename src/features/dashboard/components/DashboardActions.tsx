import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Props = { onReceivables: () => void; onDebts: () => void };

export function DashboardActions({ onReceivables, onDebts }: Props) {
  return (
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
});
