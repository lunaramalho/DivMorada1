import { Redirect } from 'expo-router';
import { session } from '@/services/session';

export default function AppIndex() {
  return <Redirect href={session.getUser() ? '/(tabs)' : '/(auth)/login'} />;
}
