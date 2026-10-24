import { useState } from 'react';
import { Image, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { DocumentPickerAsset } from 'expo-document-picker';
import type { DebtPayment } from '../types';

type Props = {
  payment: DebtPayment;
  receipt?: DocumentPickerAsset;
  busy: boolean;
  error: string;
  onClose: () => void;
  onAttach: () => void;
  onRemove: () => void;
  onConfirm: () => void;
};

export function PaymentReview({ payment, receipt, busy, error, onClose, onAttach, onRemove, onConfirm }: Props) {
  const [preview, setPreview] = useState(false);
  const [openError, setOpenError] = useState('');
  const image = receipt?.mimeType?.startsWith('image/') || /\.(png|jpe?g|webp|gif|heic)$/i.test(receipt?.name ?? '');
  const openReceipt = async () => {
    if (!receipt) return;
    setOpenError('');
    if (image) setPreview(true);
    else {
      try { await Linking.openURL(receipt.uri); }
      catch { setOpenError('Nao foi possivel abrir este arquivo.'); }
    }
  };

  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.dialog} accessibilityViewIsModal>
          <ScrollView>
            <Text style={styles.title}>Confirmar pagamento</Text>
            <Text style={styles.description}>{payment.despesa?.nome ?? 'Despesa'}</Text>
            <Text style={styles.description}>Para {payment.despesa?.criadoPor?.nome ?? 'morador'} — R$ {Number(payment.valor).toFixed(2).replace('.', ',')}</Text>
            {receipt ? (
              <View style={styles.receipt}>
                <Text style={styles.selected}>Comprovante selecionado</Text>
                <Pressable accessibilityRole="button" accessibilityLabel="Abrir comprovante" onPress={openReceipt}>
                  {image && <Image source={{ uri: receipt.uri }} style={styles.thumbnail} resizeMode="contain" />}
                  <Text style={styles.fileName}>{receipt.name}</Text>
                  <Text style={styles.link}>Abrir comprovante</Text>
                </Pressable>
                <View style={styles.row}>
                  <Pressable accessibilityRole="button" disabled={busy} onPress={onAttach} style={styles.secondary}><Text>Trocar</Text></Pressable>
                  <Pressable accessibilityRole="button" disabled={busy} onPress={onRemove} style={styles.secondary}><Text>Remover</Text></Pressable>
                </View>
              </View>
            ) : (
              <Pressable accessibilityRole="button" disabled={busy} onPress={onAttach} style={styles.secondary}><Text>Anexar comprovante (opcional)</Text></Pressable>
            )}
            {(error || openError) ? <Text accessibilityRole="alert" style={styles.error}>{error || openError}</Text> : null}
            <Pressable accessibilityRole="button" disabled={busy} onPress={onConfirm} style={[styles.primary, busy && styles.disabled]}>
              <Text style={styles.primaryText}>{busy ? 'Confirmando...' : 'Confirmar pagamento'}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" disabled={busy} onPress={onClose} style={styles.secondary}><Text>Cancelar</Text></Pressable>
          </ScrollView>
        </View>
      </View>
      <Modal transparent visible={preview} onRequestClose={() => setPreview(false)}>
        <View style={styles.overlay}>
          <View style={styles.dialog}>
            <Text style={styles.title}>Previa do comprovante</Text>
            <Image source={{ uri: receipt?.uri }} style={styles.preview} resizeMode="contain" />
            <Pressable accessibilityRole="button" onPress={() => setPreview(false)} style={styles.primary}><Text style={styles.primaryText}>Fechar previa</Text></Pressable>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  dialog: { backgroundColor: '#fff', padding: 20, borderRadius: 16, width: '100%', maxWidth: 480, maxHeight: '90%' },
  title: { fontSize: 20, fontWeight: '700', color: '#222', marginBottom: 12 },
  description: { color: '#555', marginBottom: 10 },
  receipt: { backgroundColor: '#f0fdf8', borderRadius: 10, padding: 12, marginVertical: 12 },
  selected: { color: '#168f78', fontWeight: '700', marginBottom: 10 },
  thumbnail: { width: '100%', height: 150 },
  preview: { width: '100%', height: 340 },
  fileName: { color: '#444', marginVertical: 8 },
  link: { color: '#168f78', textDecorationLine: 'underline', marginBottom: 8 },
  row: { flexDirection: 'row', gap: 10 },
  secondary: { padding: 12, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, alignItems: 'center', marginTop: 8 },
  primary: { backgroundColor: '#1abc9c', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 14 },
  primaryText: { color: '#fff', fontWeight: '700' },
  error: { color: '#c0392b', marginTop: 10 },
  disabled: { opacity: 0.6 },
});
