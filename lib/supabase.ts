import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Faltan las variables de entorno de Supabase. Copia .env.example a .env y ' +
      'define EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY con las ' +
      'credenciales de tu proyecto de Supabase.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // AsyncStorage funciona en iOS/Android y también en Web (usa localStorage por debajo).
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // Solo relevante en Web, para completar el flujo de OAuth/magic links vía URL.
    detectSessionInUrl: Platform.OS === 'web',
  },
});
