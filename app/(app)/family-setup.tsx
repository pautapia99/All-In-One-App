import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { LogInIcon, UserPlusIcon, type IconProps } from '../../components/icons';
import { useFamily } from '../../lib/FamilyProvider';
import { colors, radii, spacing, typography } from '../../lib/theme';
import type { ComponentType } from 'react';

type Mode = 'choose' | 'create' | 'join';
type Banner = { type: 'error' | 'success'; message: string } | null;

function mapFamilyError(message: string): string {
  if (message.includes('invalid_code')) {
    return 'No hemos encontrado ninguna familia con ese código. Revisa que esté bien escrito.';
  }
  if (message.includes('invalid_name')) {
    return 'Escribe un nombre para la familia.';
  }
  if (message.includes('not_authenticated')) {
    return 'Tu sesión ha caducado. Vuelve a iniciar sesión.';
  }
  if (message.includes('could_not_generate_code')) {
    return 'No se pudo generar un código único. Inténtalo de nuevo.';
  }
  return message;
}

export default function FamilySetupScreen() {
  const { createFamily, joinFamily } = useFamily();
  const [mode, setMode] = useState<Mode>('choose');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState<Banner>(null);

  function goTo(next: Mode) {
    setBanner(null);
    setMode(next);
  }

  async function handleCreate() {
    if (!name.trim()) {
      setBanner({ type: 'error', message: 'Escribe un nombre para la familia.' });
      return;
    }
    setLoading(true);
    setBanner(null);
    try {
      await createFamily(name.trim());
      // Al crearse, el layout detecta la nueva familia y navega solo.
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ha ocurrido un error inesperado.';
      console.error('[family-setup]', message);
      setBanner({ type: 'error', message: mapFamilyError(message) });
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin() {
    if (!code.trim()) {
      setBanner({ type: 'error', message: 'Escribe el código de invitación.' });
      return;
    }
    setLoading(true);
    setBanner(null);
    try {
      await joinFamily(code.trim());
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ha ocurrido un error inesperado.';
      console.error('[family-setup]', message);
      setBanner({ type: 'error', message: mapFamilyError(message) });
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
          {mode === 'choose' && (
            <>
              <Text style={styles.title}>Tu familia</Text>
              <Text style={styles.subtitle}>
                Crea una familia nueva o únete a la de alguien con un código de invitación.
              </Text>

              <View style={styles.options}>
                <OptionCard
                  icon={UserPlusIcon}
                  title="Crear familia"
                  description="Empieza una familia nueva y comparte el código con los tuyos."
                  onPress={() => goTo('create')}
                />
                <OptionCard
                  icon={LogInIcon}
                  title="Unirme con un código"
                  description="Alguien de tu familia ya tiene una y te ha pasado el código."
                  onPress={() => goTo('join')}
                />
              </View>
            </>
          )}

          {mode === 'create' && (
            <>
              <Pressable onPress={() => goTo('choose')} hitSlop={8}>
                <Text style={styles.back}>← Volver</Text>
              </Pressable>
              <Text style={styles.title}>Crear familia</Text>
              <Text style={styles.subtitle}>Ponle un nombre a tu familia.</Text>

              {banner && <BannerView banner={banner} />}

              <TextInput
                style={styles.input}
                placeholder="Ej. Familia de Cantira"
                placeholderTextColor={colors.neutral500}
                value={name}
                onChangeText={setName}
                autoFocus
              />
              <SubmitButton title="Crear familia" loading={loading} onPress={handleCreate} />
            </>
          )}

          {mode === 'join' && (
            <>
              <Pressable onPress={() => goTo('choose')} hitSlop={8}>
                <Text style={styles.back}>← Volver</Text>
              </Pressable>
              <Text style={styles.title}>Unirme con un código</Text>
              <Text style={styles.subtitle}>Introduce el código de invitación de tu familia.</Text>

              {banner && <BannerView banner={banner} />}

              <TextInput
                style={[styles.input, styles.codeInput]}
                placeholder="ABC123"
                placeholderTextColor={colors.neutral500}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={6}
                value={code}
                onChangeText={(text) => setCode(text.toUpperCase())}
                autoFocus
              />
              <SubmitButton title="Unirme" loading={loading} onPress={handleJoin} />
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function OptionCard({
  icon: Icon,
  title,
  description,
  onPress,
}: {
  icon: ComponentType<IconProps>;
  title: string;
  description: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.optionCard, pressed && styles.optionCardPressed]}
    >
      <View style={styles.optionIcon}>
        <Icon size={22} color={colors.neutral200} strokeWidth={1.75} />
      </View>
      <View style={styles.optionText}>
        <Text style={styles.optionTitle}>{title}</Text>
        <Text style={styles.optionDescription}>{description}</Text>
      </View>
    </Pressable>
  );
}

function BannerView({ banner }: { banner: NonNullable<Banner> }) {
  return (
    <View style={[styles.banner, banner.type === 'error' ? styles.bannerError : styles.bannerSuccess]}>
      <Text style={styles.bannerText}>{banner.message}</Text>
    </View>
  );
}

function SubmitButton({
  title,
  loading,
  onPress,
}: {
  title: string;
  loading: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => [
        styles.submitButton,
        pressed && !loading && styles.submitButtonPressed,
        loading && styles.submitButtonDisabled,
      ]}
    >
      <Text style={styles.submitButtonText}>{loading ? 'Un momento…' : title}</Text>
    </Pressable>
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
    marginTop: spacing.sm,
  },
  subtitle: {
    fontSize: 14,
    color: colors.neutral500,
    marginTop: spacing.sm,
    marginBottom: spacing.xl - 4,
  },
  back: {
    fontSize: 13,
    color: colors.neutral500,
  },
  options: {
    gap: spacing.md,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md + 2,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: spacing.lg,
  },
  optionCardPressed: {
    backgroundColor: colors.surfaceHover,
    transform: [{ scale: 0.98 }],
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.icon,
    backgroundColor: colors.surfaceHover,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: typography.cardTitle.fontSize,
    fontWeight: typography.cardTitle.fontWeight,
    color: colors.textPrimary,
  },
  optionDescription: {
    fontSize: 12.5,
    color: colors.neutral500,
    marginTop: 2,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  codeInput: {
    fontSize: 22,
    letterSpacing: 6,
    textAlign: 'center',
    fontWeight: '700',
  },
  submitButton: {
    backgroundColor: colors.accent500,
    borderRadius: radii.card,
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonPressed: {
    backgroundColor: colors.accent600,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: colors.neutral100,
    fontSize: 16,
    fontWeight: '700',
  },
  banner: {
    borderRadius: radii.card,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  bannerError: {
    backgroundColor: colors.accentSoftBg,
  },
  bannerSuccess: {
    backgroundColor: 'rgba(74,222,128,0.16)',
  },
  bannerText: {
    fontSize: 13,
    color: colors.textPrimary,
  },
});
