import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { HouseResidentRow } from '@/features/house/components/HouseResidentRow';
import { HouseInviteCode } from '@/features/house/components/HouseInviteCode';
import { useHouse } from '@/features/house/hooks/useHouse';

export default function HouseScreen() {
  const { router, residents, residencia, loading, canManage, handleCopyCode, handleConfirm, handleDelete } = useHouse();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.logo}><Text style={styles.brand}>DivMorada</Text></Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Moradores da Casa</Text>

        <View style={styles.houseNameBadge}>
          <Text style={styles.houseNameText}>
            {residencia ? residencia.nome.toUpperCase() : 'NENHUMA CASA SELECIONADA'}
          </Text>
        </View>

        {loading && <Text style={styles.emptyText}>Carregando moradores...</Text>}

        {!loading && residents.length === 0 && (
          <Text style={styles.emptyText}>Nenhum morador cadastrado nesta casa.</Text>
        )}

        {residents.map(r => (
          <HouseResidentRow
            key={r.id}
            resident={r}
            canManage={canManage}
            onConfirm={handleConfirm}
            onDelete={handleDelete}
          />
        ))}

        {residencia && (
          <HouseInviteCode code={residencia.codigo} onCopy={handleCopyCode} />
        )}

        <TouchableOpacity
          style={styles.btnAddExpense}
          onPress={() => router.push('/add-expense')}
        >
          <Text style={styles.btnAddExpenseText}>Adicionar Nova Despesa </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f4f6f5' },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' },
  logo: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  brand: { color: '#1abc9c' },

  content: { padding: 20, paddingBottom: 40 },
  pageTitle: { fontSize: 22, fontWeight: 'bold', color: '#222', marginBottom: 14 },

  houseNameBadge: {
    borderWidth: 1, borderColor: '#ccc', borderRadius: 6,
    paddingVertical: 8, paddingHorizontal: 14,
    alignSelf: 'flex-start', marginBottom: 20,
  },
  houseNameText: { fontWeight: '700', color: '#333', fontSize: 13, letterSpacing: 0.5 },
  emptyText: { color: '#888', marginBottom: 14 },

  btnAddExpense: {
    backgroundColor: '#1abc9c', borderRadius: 14,
    paddingVertical: 18, alignItems: 'center',
  },
  btnAddExpenseText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
