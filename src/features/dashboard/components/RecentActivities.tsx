import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import type { Historico } from '@/services/api';

type Props = { recentActivities: Historico[]; loading: boolean };

export function RecentActivities({ recentActivities, loading }: Props) {
  return (
    <View style={styles.activitySection}>
      <Text style={styles.sectionTitle}>Atividades Recentes</Text>
      {loading && <Text style={styles.emptyText}>Carregando atividades...</Text>}
      {!loading && recentActivities.length === 0 && (
        <Text style={styles.emptyText}>Nenhuma atividade recente.</Text>
      )}
      {recentActivities.map(item => (
        <View key={item.id} style={styles.activityItem}>
          <View style={[styles.iconCircle, { backgroundColor: '#5D6D7E' }]}>
            <MaterialCommunityIcons name="history" size={24} color="white" />
          </View>
          <View style={styles.activityDetails}>
            <Text style={styles.activityText}>{item.acao}</Text>
            <Text style={styles.activitySubtext}>{item.descricao || 'Sem descricao'}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  activitySection: { marginTop: 30 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  activityItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  iconCircle: { width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  activityText: { fontSize: 16, fontWeight: '600' },
  activityDetails: { flex: 1, minWidth: 0 },
  activitySubtext: { color: '#7f8c8d' },
  emptyText: { color: '#7f8c8d' },
});
