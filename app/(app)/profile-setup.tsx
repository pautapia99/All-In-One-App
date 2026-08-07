import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Banner, type BannerProps } from '../../components/Banner';
import { CalendarDatePicker } from '../../components/CalendarDatePicker';
import { SubmitButton } from '../../components/SubmitButton';
import { useProfile } from '../../lib/ProfileProvider';
import { useColors } from '../../lib/ThemeProvider';
import { radii, spacing, typography, type ColorPalette } from '../../lib/theme';

type BannerState = BannerProps | null;

export default function ProfileSetupScreen() {
  const { saveProfile } = useProfile();
  const colors = useColors();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState<string | null>(null);
  const [alias, setAlias] = useState('');
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState<BannerState>(null);

  async function handleSubmit() {
    setBanner(null);

    if (!firstName.trim() || !lastName.trim() || !alias.trim()) {
      setBanner({ type: 'error', message: 'Rellena todos los campos.' });
      return;
    }
    if (!birthDate) {
      setBanner({ type: 'error', message: 'Elige tu fecha de nacimiento.' });
      return;
    }

    setLoading(true);
    try {
      await saveProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        birth_date: birthDate,
        alias: alias.trim(),
      });
      // Al guardarse, el layout detecta el perfil y navega solo.
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ha ocurrido un error inesperado.';
      console.error('[profile-setup]', message);
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
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <Text style={styles.title}>Sobre ti</Text>
          <Text style={styles.subtitle}>
            Antes de continuar, cuéntanos un poco sobre ti.
          </Text>

          {banner && <Banner type={banner.type} message={banner.message} />}

          <View style={styles.field}>
            <Text style={styles.label}>Nombre</Text>
            <TextInput
              style={styles.input}
              placeholder="María"
              placeholderTextColor={colors.textMuted}
              value={firstName}
              onChangeText={setFirstName}
              autoFocus
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Apellido</Text>
            <TextInput
              style={styles.input}
              placeholder="Tapia"
              placeholderTextColor={colors.textMuted}
              value={lastName}
              onChangeText={setLastName}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Fecha de nacimiento</Text>
            <CalendarDatePicker value={birthDate} onChange={setBirthDate} />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Alias</Text>
            <TextInput
              style={styles.input}
              placeholder="¿Cómo quieres que te llamemos?"
              placeholderTextColor={colors.textMuted}
              value={alias}
              onChangeText={setAlias}
            />
          </View>

          <SubmitButton title="Continuar" loading={loading} onPress={handleSubmit} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function getStyles(colors: ColorPalette) {
  return StyleSheet.create({
    flex: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: spacing.xl,
    },
    content: {
      width: '100%',
      maxWidth: 420,
      alignSelf: 'center',
    },
    title: {
      fontFamily: typography.fontFamily,
      fontWeight: typography.h1.fontWeight,
      fontSize: 26,
      color: colors.textPrimary,
    },
    subtitle: {
      fontSize: 14,
      color: colors.textMuted,
      marginTop: spacing.sm,
      marginBottom: spacing.xl - 4,
    },
    field: {
      marginBottom: spacing.md,
    },
    label: {
      fontSize: 12,
      color: colors.textMuted,
      marginBottom: 6,
    },
    input: {
      backgroundColor: colors.surface,
      borderRadius: radii.card,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      fontSize: 16,
      color: colors.textPrimary,
    },
  });
}
