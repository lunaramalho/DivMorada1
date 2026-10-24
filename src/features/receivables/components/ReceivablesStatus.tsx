import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

type Props = { loading: boolean };

export function ReceivablesStatus({ loading }: Props) {
  return loading ? (
    <View style={styles.stateBox}>
      <ActivityIndicator color="#1abc9c" />
      <Text style={styles.stateText}>Carregando recebiveis...</Text>
    </View>
  ) : (
    <View style={styles.stateBox}>
      <Text style={styles.emptyTitle}>Ninguem te deve no momento</Text>
      <Text style={styles.stateText}>Quando houver pagamentos pendentes para voce, eles aparecem aqui.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stateBox: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    gap: 10,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#222' },
  stateText: { fontSize: 13, color: '#777', textAlign: 'center' },
});
