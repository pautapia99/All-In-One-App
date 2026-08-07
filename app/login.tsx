import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { PrimaryButton } from '../components/PrimaryButton';
import { supabase } from '../lib/supabase';

type Mode = 'sign-in' | 'sign-up';
type Banner = { type: 'error' | 'success'; message: string };

export default function LoginScreen() {
  const [mode, setMode] = useState<Mode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState<Banner | null>(null);

  const isSignUp = mode === 'sign-up';

  async function handleSubmit() {
    setBanner(null);

    if (!email || !password) {
      setBanner({ type: 'error', message: 'Introduce tu email y contraseña.' });
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setBanner({
          type: 'success',
          message: 'Revisa tu email: te hemos enviado un enlace de confirmación para activar tu cuenta.',
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error) {
      // Nota: usamos un banner en pantalla en vez de Alert.alert porque
      // react-native-web no implementa Alert (no muestra nada en Web).
      const message = error instanceof Error ? error.message : 'Ha ocurrido un error inesperado.';
      console.error('[login]', message);
      setBanner({ type: 'error', message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Family Hub</Text>
        <Text style={styles.subtitle}>
          {isSignUp ? 'Crea una cuenta para tu familia' : 'Inicia sesión para continuar'}
        </Text>

        {banner && (
          <View style={[styles.banner, banner.type === 'error' ? styles.bannerError : styles.bannerSuccess]}>
            <Text style={styles.bannerText}>{banner.message}</Text>
          </View>
        )}

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Contraseña"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="password"
            value={password}
            onChangeText={setPassword}
          />

          <PrimaryButton
            title={isSignUp ? 'Registrarme' : 'Iniciar sesión'}
            onPress={handleSubmit}
            loading={loading}
          />
        </View>

        <Text
          style={styles.switchModeText}
          onPress={() => {
            setBanner(null);
            setMode(isSignUp ? 'sign-in' : 'sign-up');
          }}
        >
          {isSignUp
            ? '¿Ya tienes cuenta? Inicia sesión'
            : '¿No tienes cuenta? Regístrate'}
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    color: '#1c1c1e',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#6b7280',
    marginBottom: 32,
  },
  banner: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  bannerError: {
    backgroundColor: '#fee2e2',
  },
  bannerSuccess: {
    backgroundColor: '#dcfce7',
  },
  bannerText: {
    fontSize: 14,
    color: '#1c1c1e',
  },
  form: {
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  switchModeText: {
    marginTop: 24,
    textAlign: 'center',
    color: '#2f6690',
    fontSize: 14,
  },
});
