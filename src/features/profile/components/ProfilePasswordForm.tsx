import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { useProfile } from '../hooks/useProfile';

type Props = Pick<ReturnType<typeof useProfile>,
  | 'showPasswordForm'
  | 'setShowPasswordForm'
  | 'showCurrent'
  | 'setShowCurrent'
  | 'showNew'
  | 'setShowNew'
  | 'showConfirm'
  | 'setShowConfirm'
  | 'currentPassword'
  | 'setCurrentPassword'
  | 'newPassword'
  | 'setNewPassword'
  | 'confirmPassword'
  | 'setConfirmPassword'
  | 'saving'
  | 'handleChangePassword'
>;

export function ProfilePasswordForm({
  showPasswordForm,
  setShowPasswordForm,
  showCurrent,
  setShowCurrent,
  showNew,
  setShowNew,
  showConfirm,
  setShowConfirm,
  currentPassword,
  setCurrentPassword,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  saving,
  handleChangePassword,
}: Props) {
  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.passwordHeader}
        onPress={() => setShowPasswordForm(prev => !prev)}
      >
        <View style={styles.passwordHeaderLeft}>
          <MaterialCommunityIcons name="lock-outline" size={20} color="#888" />
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.fieldLabel}>Senha</Text>
            <Text style={styles.fieldValue}>********</Text>
          </View>
        </View>
        <MaterialCommunityIcons
          name={showPasswordForm ? 'chevron-up' : 'chevron-down'}
          size={22}
          color="#1abc9c"
        />
      </TouchableOpacity>

      {showPasswordForm && (
        <View style={styles.passwordForm}>
          <View style={styles.separator} />

          <Text style={styles.passLabel}>Senha Atual:</Text>
          <View style={styles.passInputRow}>
            <TextInput
              style={styles.passInput}
              placeholder="Digite sua senha atual"
              placeholderTextColor="#bbb"
              secureTextEntry={!showCurrent}
              value={currentPassword}
              onChangeText={setCurrentPassword}
            />
            <TouchableOpacity onPress={() => setShowCurrent(prev => !prev)}>
              <MaterialCommunityIcons
                name={showCurrent ? 'eye-off-outline' : 'eye-outline'}
                size={20} color="#aaa"
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.passLabel}>Nova Senha:</Text>
          <View style={styles.passInputRow}>
            <TextInput
              style={styles.passInput}
              placeholder="Minimo 6 caracteres"
              placeholderTextColor="#bbb"
              secureTextEntry={!showNew}
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <TouchableOpacity onPress={() => setShowNew(prev => !prev)}>
              <MaterialCommunityIcons
                name={showNew ? 'eye-off-outline' : 'eye-outline'}
                size={20} color="#aaa"
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.passLabel}>Confirmar Nova Senha:</Text>
          <View style={styles.passInputRow}>
            <TextInput
              style={styles.passInput}
              placeholder="Repita a nova senha"
              placeholderTextColor="#bbb"
              secureTextEntry={!showConfirm}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            <TouchableOpacity onPress={() => setShowConfirm(prev => !prev)}>
              <MaterialCommunityIcons
                name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                size={20} color="#aaa"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.btnChangePass, saving && styles.btnDisabled]}
            onPress={handleChangePassword}
            disabled={saving}
          >
            <Text style={styles.btnChangePassText}>
              {saving ? 'Salvando...' : 'Alterar Senha'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff', borderRadius: 16,
    width: '100%', padding: 4,
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07, shadowRadius: 4,
    marginBottom: 16,
  },
  separator: { height: 1, backgroundColor: '#f0f0f0', marginHorizontal: 16 },

  fieldLabel: { fontSize: 11, color: '#aaa', fontWeight: '600', marginBottom: 2 },
  fieldValue: { fontSize: 15, color: '#222', fontWeight: '600' },
  passwordHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, paddingHorizontal: 16,
  },
  passwordHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
  passwordForm: { paddingHorizontal: 16, paddingBottom: 16, paddingTop: 4 },

  passLabel: { fontSize: 12, color: '#888', fontWeight: '600', marginTop: 14, marginBottom: 6 },
  passInputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#ddd', borderRadius: 10,
    paddingHorizontal: 12, backgroundColor: '#fafafa',
  },
  passInput: { flex: 1, height: 44, fontSize: 14, color: '#333' },

  btnChangePass: {
    backgroundColor: '#1abc9c', borderRadius: 10,
    paddingVertical: 12, alignItems: 'center', marginTop: 18,
  },
  btnChangePassText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  btnDisabled: { opacity: 0.7 },
});
