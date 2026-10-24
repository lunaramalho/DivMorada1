import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AvatarContent } from '@/components/AvatarContent';
import type { useProfile } from '../hooks/useProfile';

type Props = Pick<ReturnType<typeof useProfile>,
  | 'photoUri'
  | 'name'
  | 'handleChangePhoto'
>;

export function ProfilePhoto({
  photoUri,
  name,
  handleChangePhoto,
}: Props) {
  return (
    <View style={styles.photoSection}>
      <View style={styles.photoCircle}>
        <AvatarContent
          photoUri={photoUri}
          initial={name.trim().charAt(0).toUpperCase() || 'U'}
          textStyle={styles.photoLetter}
        />
      </View>
      <TouchableOpacity style={styles.btnPhoto} onPress={handleChangePhoto}>
        <Text style={styles.btnPhotoText}>Alterar Foto</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  photoSection: { alignItems: 'center', marginBottom: 28 },
  photoCircle: {
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: '#bdc3c7',
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
    overflow: 'hidden',
  },
  photoLetter: { color: '#fff', fontSize: 44, fontWeight: 'bold' },
  btnPhoto: { backgroundColor: '#1abc9c', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 24 },
  btnPhotoText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
