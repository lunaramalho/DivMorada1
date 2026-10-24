import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

type Props = { message: string };

export function RegistrationSuccessMessage({ message }: Props) {
  if (!message) return null;

  return (
    <View style={styles.successBox}>
      <MaterialCommunityIcons name="check-circle-outline" size={22} color="#1abc9c" />
      <Text style={styles.successText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#eafaf1',
    borderWidth: 1,
    borderColor: '#1abc9c',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  successText: { flex: 1, color: '#168f78', fontWeight: '700', fontSize: 14 },
});
