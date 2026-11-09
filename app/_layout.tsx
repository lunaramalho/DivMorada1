import { Stack, usePathname, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, AppState, Pressable, Text, View } from 'react-native';
import { authService } from '@/services/api';
import { session } from '@/services/session';
import { supabase } from '@/services/supabase';

export default function RootLayout() {
  const pathname = usePathname();
  const router = useRouter();
  const [initialPath] = useState(pathname);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!ready) return;
    let active = true;
    const checkHouse = async () => {
      const house = session.getResidencia();
      const user = session.getUser();
      if (!house || !user) return;
      try {
        const { data, error } = await supabase.from('residencia_usuarios').select('id')
          .eq('residenciaId', house.id).eq('usuarioId', user.id).eq('ativo', true).maybeSingle();
        if (active && !error && !data && session.getResidencia()?.id === house.id) {
          session.setResidencia(null); router.replace('/join-house');
        }
      } catch { /* A network error never changes membership locally. */ }
    };
    void checkHouse();
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') void checkHouse(); });
    return () => { active = false; subscription.remove(); };
  }, [pathname, ready, router]);
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
      <Stack.Screen name="confirmations" options={{ presentation: 'card' }} />
    </Stack>
  );
}
