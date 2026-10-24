import { Stack, usePathname } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { authService } from '@/services/api';
import { session } from '@/services/session';

export default function RootLayout() {
  const pathname = usePathname();
  const [initialPath] = useState(pathname);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    // Recovery consumes its own temporary session and must stay publicly accessible.
    const restoration = initialPath === '/reset-password' || initialPath === '/forgot-password' || session.getUser()
      ? Promise.resolve() : authService.restoreSession();
    restoration.then(() => { if (active) setReady(true); })
      .catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [retry, initialPath]);
  if (!ready) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
    {error ? <><Text>Não foi possível recuperar sua sessão. Confira a conexão.</Text><Pressable accessibilityRole="button" onPress={() => { setError(false); setRetry(value => value + 1); }} style={{ padding: 16 }}><Text>Tentar novamente</Text></Pressable></> : <ActivityIndicator color="#1abc9c" />}
  </View>;
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="add-expense" options={{ presentation: 'modal' }} />
      <Stack.Screen name="debtors" options={{ presentation: 'card' }} />
      <Stack.Screen name="receivables" options={{ presentation: 'card' }} />
    </Stack>
  );
}
