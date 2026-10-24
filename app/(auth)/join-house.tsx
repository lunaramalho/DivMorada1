import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { HouseOnboardingTabs } from '@/features/house-onboarding/components/HouseOnboardingTabs';
import { JoinHouseForm } from '@/features/house-onboarding/components/JoinHouseForm';
import { CreateHouseForm } from '@/features/house-onboarding/components/CreateHouseForm';
import { useHouseOnboarding } from '@/features/house-onboarding/hooks/useHouseOnboarding';

export default function JoinHouseScreen() {
  const {
    router, tab, setTab, code, setCode, houseName, setHouseName,
    loading, handleJoin, handleCreate,
  } = useHouseOnboarding();

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.logoRow}>
            <Text style={styles.logo}><Text style={styles.brand}>DivMorada</Text></Text>
          </View>

          <View style={styles.iconWrap}>
            <MaterialCommunityIcons name="home-group" size={72} color="#1abc9c" />
          </View>

          <Text style={styles.title}>Bem-vindo ao DivMorada!</Text>
          <Text style={styles.subtitle}>
            Para comecar, entre em uma casa existente usando o codigo de convite, ou crie uma nova casa.
          </Text>

          <HouseOnboardingTabs tab={tab} onChangeTab={setTab} />

          {tab === 'join' ? (
            <JoinHouseForm code={code} onChangeCode={setCode} loading={loading} onJoin={handleJoin} />
          ) : (
            <CreateHouseForm houseName={houseName} onChangeHouseName={setHouseName} loading={loading} onCreate={handleCreate} />
          )}

          <TouchableOpacity style={styles.btnBack} onPress={() => router.replace('/login')}>
            <Text style={styles.btnBackText}>Voltar para o Login</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f4f6f5' },
  content: { padding: 24, paddingBottom: 48, alignItems: 'center' },

  logoRow: { width: '100%', marginBottom: 8 },
  logo: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  brand: { color: '#1abc9c' },

  iconWrap: { marginTop: 16, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#222', textAlign: 'center', marginBottom: 10 },
  subtitle: { fontSize: 14, color: '#777', textAlign: 'center', lineHeight: 20, marginBottom: 28, paddingHorizontal: 8 },

  btnBack: { marginTop: 8 },
  btnBackText: { color: '#888', fontSize: 14 },
});
