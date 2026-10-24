import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '@/styles/theme';
import type { useRegistration } from '../hooks/useRegistration';

type Props = Pick<ReturnType<typeof useRegistration>,
  | 'fullName'
  | 'photoUri'
  | 'handlePickPhoto'
>;

export function RegistrationPhotoPicker({
  fullName,
  photoUri,
  handlePickPhoto,
}: Props) {
  return (
    <View style={styles.avatarRow}>
      <TouchableOpacity style={styles.avatarCircle} onPress={handlePickPhoto}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.avatarImage} />
        ) : (
          <Text style={styles.avatarLetter}>
            {fullName.trim().charAt(0).toUpperCase() || 'A'}
          </Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity style={styles.avatarTextBox} onPress={handlePickPhoto}>
        <Text style={styles.avatarHint}>
          {photoUri ? 'Foto selecionada. Toque para trocar.' : 'Clique para escolher sua foto\nde perfil'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarLetter: { color: '#FFF', fontSize: 22, fontWeight: 'bold' },
  avatarTextBox: {
    flex: 1,
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  avatarHint: { color: '#777', fontSize: 13, lineHeight: 18 },
});
