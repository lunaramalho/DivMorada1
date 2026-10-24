import { StyleSheet, Text, View } from 'react-native';
import type { Person } from '../types';

type Props = {
  people: Person[];
  participants: string[];
  valuePerPerson: number;
};

export function ExpenseSplitSummary({ people, participants, valuePerPerson }: Props) {
  return (
    <>
      {participants.length > 0 && valuePerPerson > 0 && (
        <View style={styles.calcBox}>
          <Text style={styles.calcTitle}>
            VALOR P/ PESSOA: R$ {valuePerPerson.toFixed(2).replace('.', ',')}
          </Text>
          <View style={styles.calcGrid}>
            {participants.map(pid => {
              const person = people.find(p => p.id === pid);
              return (
                <Text key={pid} style={styles.calcItem}>
                  {person?.name} (R$ {valuePerPerson.toFixed(0)})
                </Text>
              );
            })}
          </View>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  calcBox: {
    backgroundColor: '#f0fdf8', borderRadius: 10,
    padding: 14, marginTop: 14, borderWidth: 1, borderColor: '#b2dfdb',
  },
  calcTitle: { fontWeight: 'bold', color: '#1abc9c', fontSize: 14, marginBottom: 8 },
  calcGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  calcItem: { fontSize: 13, color: '#444', width: '45%' },

});
