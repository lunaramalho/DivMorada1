import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { FinancialSummaryCard } from '@/features/dashboard/components/FinancialSummaryCard';
import { DashboardActions } from '@/features/dashboard/components/DashboardActions';
import { RecentActivities } from '@/features/dashboard/components/RecentActivities';
import { useDashboard } from '@/features/dashboard/hooks/useDashboard';

export default function HomeScreen() {
  const { router, summary, recentActivities, loading } = useDashboard();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>DivMorada</Text>
      </View>

      <FinancialSummaryCard summary={summary} />

      <DashboardActions
        onReceivables={() => router.push('/receivables')}
        onDebts={() => router.push('/debtors')}
      />

      <RecentActivities recentActivities={recentActivities} loading={loading} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9f9', padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, marginTop: 40 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1abc9c' },
});
