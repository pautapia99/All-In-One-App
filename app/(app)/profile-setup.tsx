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

import { Banner, type BannerProps } from '../../components/Banner';
import { SubmitButton } from '../../components/SubmitButton';
import { useProfile } from '../../lib/ProfileProvider';
import { colors, radii, spacing, typography } from '../../lib/theme';

type BannerState = BannerProps | null;

const DATE_RE = /^(\d{2})\/(\d{2})\/(\d{4})$/;

function parseBirthDate(input: string): string | null {
  const match = DATE_RE.exec(input.trim());
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  const isRealDate =
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  if (!isRealDate) return null;
  if (date.getTime() > Date.now()) return null;

  return `${year.toString().padStart(4, '0')}-${match[2]}-${match[1]}`;
}

export default function ProfileSetupScreen() {
  const { saveProfile } = useProfile();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDateText, setBirthDateText] = useState('');
  const [alias, setAlias] = useState('');
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState<BannerState>(null);

  async function handleSubmit() {
    setBanner(null);

    if (!firstName.trim() || !lastName.trim() || !alias.trim()) {
      setBanner({ type: 'error', message: 'Rellena todos los campos.' });
      return;
    }

    const birthDate = parseBirthDate(birthDateText);
    if (!birthDate) {
      setBanner({
        type: 'error',
        message: 'La fecha de nacimiento no es válida. Usa el formato DD/MM/AAAA.',
      });
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
              placeholderTextColor={colors.neutral500}
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
              placeholderTextColor={colors.neutral500}
              value={lastName}
              onChangeText={setLastName}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Fecha de nacimiento</Text>
            <TextInput
              style={styles.input}
              placeholder="DD/MM/AAAA"
              placeholderTextColor={colors.neutral500}
              maxLength={10}
              value={birthDateText}
              onChangeText={setBirthDateText}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Alias</Text>
            <TextInput
              style={styles.input}
              placeholder="¿Cómo quieres que te llamemos?"
              placeholderTextColor={colors.neutral500}
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

const styles = StyleSheet.create({
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
    color: colors.neutral500,
    marginTop: spacing.sm,
    marginBottom: spacing.xl - 4,
  },
  field: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 12,
    color: colors.neutral500,
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
