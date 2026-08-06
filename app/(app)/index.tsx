import { StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '../../components/PrimaryButton';
import { useAuth } from '../../lib/AuthProvider';
import { supabase } from '../../lib/supabase';

export default function HomeScreen() {
  const { session } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>¡Bienvenido/a!</Text>
      <Text style={styles.subtitle}>{session?.user.email}</Text>

      <Text style={styles.placeholder}>
        Aquí vivirá el panel principal: listas, calendario, presupuesto y comidas.
      </Text>

      <View style={styles.buttonWrapper}>
        <PrimaryButton title="Cerrar sesión" onPress={() => supabase.auth.signOut()} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
    gap: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1c1c1e',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 24,
  },
  placeholder: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 32,
  },
  buttonWrapper: {
    alignSelf: 'stretch',
  },
});
