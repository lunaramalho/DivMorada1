import { SafeAreaView } from 'react-native-safe-area-context';
import type { ReactNode } from 'react';
import { useRouter } from 'expo-router';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export function RecoveryLayout({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  const router = useRouter();
  return <SafeAreaView style={recoveryStyles.safe}><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={recoveryStyles.container}>
    <View style={recoveryStyles.card}><Text style={recoveryStyles.brand}>DivMorada</Text><Text style={recoveryStyles.title}>{title}</Text><Text style={recoveryStyles.description}>{description}</Text>{children}
      <Pressable accessibilityRole="button" onPress={() => router.replace('/login')} style={recoveryStyles.linkButton}><Text style={recoveryStyles.link}>Voltar ao login</Text></Pressable>
    </View>
  </ScrollView></KeyboardAvoidingView></SafeAreaView>;
}
export const recoveryStyles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f5f6f5' }, container: { flexGrow: 1, justifyContent: 'center', padding: 20 }, card: { width: '100%', maxWidth: 480, alignSelf: 'center', backgroundColor: '#fff', padding: 22, borderRadius: 16, borderWidth: 1, borderColor: '#e2e6e4' }, brand: { color: '#1abc9c', fontSize: 25, fontWeight: '700', marginBottom: 28 }, title: { fontSize: 22, color: '#292e2b', fontWeight: '700', marginBottom: 12 }, description: { color: '#626b67', fontSize: 14, lineHeight: 21, marginBottom: 24 }, error: { backgroundColor: '#fff2f2', color: '#a93232', padding: 12, borderRadius: 8, marginVertical: 12 }, success: { backgroundColor: '#effaf4', color: '#18734e', padding: 12, borderRadius: 8, marginVertical: 12, lineHeight: 22 }, button: { backgroundColor: '#229c76', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 12 }, buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 }, disabled: { opacity: 0.6 }, linkButton: { paddingVertical: 14, alignItems: 'center', marginTop: 10 }, link: { color: '#168f78', fontWeight: '600' },
});
