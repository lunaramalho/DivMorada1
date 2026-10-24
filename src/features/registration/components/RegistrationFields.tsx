import { Input } from '@/components/Input';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, TouchableOpacity } from 'react-native';
import type { useRegistration } from '../hooks/useRegistration';

type Props = Pick<ReturnType<typeof useRegistration>,
  | 'fullName'
  | 'email'
  | 'password'
  | 'confirmPassword'
  | 'showPassword'
  | 'showConfirmPassword'
  | 'setFullName'
  | 'setEmail'
  | 'setPassword'
  | 'setConfirm'
  | 'setShowPassword'
  | 'setShowConfirmPassword'
>;

export function RegistrationFields({
  fullName,
  email,
  password,
  confirmPassword,
  showPassword,
  showConfirmPassword,
  setFullName,
  setEmail,
  setPassword,
  setConfirm,
  setShowPassword,
  setShowConfirmPassword,
}: Props) {
  return (
    <>
      <Input
        label="Nome Completo:"
        placeholder="Ana Paula Silva"
        value={fullName}
        onChangeText={setFullName}
      />

      <Input
        label="E-mail:"
        placeholder="ana.silva@email.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Input
        label="Senha (minimo 6 caracteres):"
        placeholder="******"
        value={password}
        onChangeText={setPassword}
        secureTextEntry={!showPassword}
        rightElement={
          <TouchableOpacity
            onPress={() => setShowPassword(prev => !prev)}
            style={styles.passwordToggle}
          >
            <MaterialCommunityIcons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={22}
              color="#777"
            />
          </TouchableOpacity>
        }
      />

      <Input
        label="Confirmar Senha:"
        placeholder="******"
        value={confirmPassword}
        onChangeText={setConfirm}
        secureTextEntry={!showConfirmPassword}
        rightElement={
          <TouchableOpacity
            onPress={() => setShowConfirmPassword(prev => !prev)}
            style={styles.passwordToggle}
          >
            <MaterialCommunityIcons
              name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
              size={22}
              color="#777"
            />
          </TouchableOpacity>
        }
      />
    </>
  );
}

const styles = StyleSheet.create({
  passwordToggle: { paddingLeft: 10, paddingVertical: 10 },
});
