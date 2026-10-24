import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { Person } from '../types';

type Props = {
  people: Person[];
  selectedIds: readonly string[];
  onSelect: (id: string) => void;
};

export function ResidentSelector({ people, selectedIds, onSelect }: Props) {
  return (
    <View style={styles.avatarRow}>
      {people.map(p => (
        <TouchableOpacity
          key={p.id}
          style={styles.avatarCol}
          onPress={() => onSelect(p.id)}
        >
          <View style={[
            styles.avatarCircle,
            { backgroundColor: p.avatarColor },
            selectedIds.includes(p.id) && styles.avatarSelected,
          ]}>
            <Text style={styles.avatarLetter}>{p.avatarLetter}</Text>
            {selectedIds.includes(p.id) && (
              <View style={styles.checkBadge}>
                <Text style={styles.checkText}>✓</Text>
              </View>
            )}
          </View>
          <Text style={styles.avatarName}>{p.short}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  avatarRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 6, marginBottom: 4 },
  avatarCol: { alignItems: 'center', gap: 6 },
  avatarCircle: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  avatarSelected: { borderWidth: 3, borderColor: '#1abc9c' },
  avatarLetter: { color: '#fff', fontWeight: 'bold', fontSize: 20 },
  avatarName: { fontSize: 12, color: '#555', fontWeight: '600' },

  checkBadge: {
    position: 'absolute', bottom: -2, right: -2,
    backgroundColor: '#1abc9c', borderRadius: 10, width: 18, height: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  checkText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },

});
