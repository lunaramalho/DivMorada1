import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase nao configurado. Defina EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY.',
  );
}

const isBrowser = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const supabaseStorage = {
  async getItem(key: string) {
    if (Platform.OS === 'web') {
      return isBrowser() ? window.localStorage.getItem(key) : null;
    }

    return AsyncStorage.getItem(key);
  },

  async setItem(key: string, value: string) {
    if (Platform.OS === 'web') {
      if (isBrowser()) {
        window.localStorage.setItem(key, value);
      }
      return;
    }

    return AsyncStorage.setItem(key, value);
  },

  async removeItem(key: string) {
    if (Platform.OS === 'web') {
      if (isBrowser()) {
        window.localStorage.removeItem(key);
      }
      return;
    }

    return AsyncStorage.removeItem(key);
  },
};

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '', {
  auth: {
    storage: supabaseStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
