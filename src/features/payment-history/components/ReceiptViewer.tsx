import { useState } from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

export function ReceiptViewer({ url, onClose }: { url: string; onClose: () => void }) {
  const [failed, setFailed] = useState(false);
  return <Modal transparent visible onRequestClose={onClose} animationType="fade"><View style={styles.overlay}><View style={styles.dialog}>
    <Text style={styles.title}>Comprovante de pagamento</Text>
    {failed ? <Text accessibilityRole="alert">Não foi possível carregar o comprovante.</Text> : <Image source={{ uri: url }} resizeMode="contain" style={styles.image} onError={() => setFailed(true)} accessibilityLabel="Imagem do comprovante de pagamento" />}
    <Pressable accessibilityRole="button" onPress={onClose} style={styles.button}><Text style={styles.buttonText}>Fechar comprovante</Text></Pressable>
  </View></View></Modal>;
}
const styles = StyleSheet.create({ overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', padding: 16, alignItems: 'center', justifyContent: 'center' }, dialog: { width: '100%', maxWidth: 700, maxHeight: '95%', padding: 16, backgroundColor: '#fff', borderRadius: 16 }, title: { fontWeight: '700', fontSize: 18, marginBottom: 12 }, image: { width: '100%', height: 360 }, button: { padding: 14, backgroundColor: '#168f78', borderRadius: 8, marginTop: 12, alignItems: 'center' }, buttonText: { color: '#fff', fontWeight: '700' } });
