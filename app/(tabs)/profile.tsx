import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ProfilePhoto } from '@/features/profile/components/ProfilePhoto';
import { ProfileDetails } from '@/features/profile/components/ProfileDetails';
import { ProfilePasswordForm } from '@/features/profile/components/ProfilePasswordForm';
import { useProfile } from '@/features/profile/hooks/useProfile';

export default function ProfileScreen() {
  const {
    router,
    name,
    email,
    photoUri,
    modality,
    editName,
    saving,
    currentPassword,
    newPassword,
    confirmPassword,
    showPasswordForm,
    showCurrent,
    showNew,
    showConfirm,
    setName,
    setEditName,
    setCurrentPassword,
    setNewPassword,
    setConfirmPassword,
    setShowPasswordForm,
    setShowCurrent,
    setShowNew,
    setShowConfirm,
    handleSave,
    handleChangePhoto,
    handleChangePassword,
    handleLogout,
  } = useProfile();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={styles.backBtn}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.logo}><Text style={styles.brand}>DivMorada</Text></Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Seu Perfil</Text>

        <ProfilePhoto
          photoUri={photoUri}
          name={name}
          handleChangePhoto={handleChangePhoto}
        />

        <ProfileDetails
          name={name}
          email={email}
          modality={modality}
          editName={editName}
          setName={setName}
          setEditName={setEditName}
        />

        <TouchableOpacity accessibilityRole="button" style={styles.historyButton} onPress={() => router.push('/payment-history')}>
          <MaterialCommunityIcons name="history" size={22} color="#168f78" />
          <Text style={styles.historyText}>Meu histórico de pagamentos</Text>
        </TouchableOpacity>

        <ProfilePasswordForm
          showPasswordForm={showPasswordForm}
          setShowPasswordForm={setShowPasswordForm}
          showCurrent={showCurrent}
          setShowCurrent={setShowCurrent}
          showNew={showNew}
          setShowNew={setShowNew}
          showConfirm={showConfirm}
          setShowConfirm={setShowConfirm}
          currentPassword={currentPassword}
          setCurrentPassword={setCurrentPassword}
          newPassword={newPassword}
          setNewPassword={setNewPassword}
          confirmPassword={confirmPassword}
          setConfirmPassword={setConfirmPassword}
          saving={saving}
          handleChangePassword={handleChangePassword}
        />

        <TouchableOpacity
          style={[styles.btnSave, saving && styles.btnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.btnSaveText}>
            {saving ? 'Salvando...' : 'Salvar Alteracoes'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnLogout} onPress={handleLogout}>
          <MaterialCommunityIcons name="logout" size={18} color="#e74c3c" />
          <Text style={styles.btnLogoutText}>Sair da Conta</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f4f6f5' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10,
    backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee',
  },
  backBtn: { marginRight: 10, padding: 4 },
  backArrow: { fontSize: 30, color: '#1abc9c', lineHeight: 32 },
  logo: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  brand: { color: '#1abc9c' },

  content: { padding: 20, paddingBottom: 48, alignItems: 'center' },
  pageTitle: { fontSize: 24, fontWeight: 'bold', color: '#888', marginBottom: 24, alignSelf: 'center' },

  btnSave: {
    backgroundColor: '#1abc9c', borderRadius: 14,
    paddingVertical: 18, alignItems: 'center',
    width: '100%', marginBottom: 16, marginTop: 8,
  },
  btnDisabled: { opacity: 0.7 },
  historyButton: { width: '100%', flexDirection: 'row', gap: 8, alignItems: 'center', padding: 16, borderRadius: 12, backgroundColor: '#e4f6f0', marginVertical: 16 },
  historyText: { flex: 1, color: '#168f78', fontWeight: '700', fontSize: 15 },
  btnSaveText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  btnLogout: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12 },
  btnLogoutText: { color: '#e74c3c', fontWeight: '600', fontSize: 14 },
});
