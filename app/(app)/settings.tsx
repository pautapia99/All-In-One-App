import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Banner, type BannerProps } from '../../components/Banner';
import { BirthDatePicker } from '../../components/BirthDatePicker';
import { ChevronLeftIcon } from '../../components/icons';
import { SubmitButton } from '../../components/SubmitButton';
import { useProfile } from '../../lib/ProfileProvider';
import { useColors, useThemeMode } from '../../lib/ThemeProvider';
import { supabase } from '../../lib/supabase';
import { radii, spacing, typography, type ColorPalette } from '../../lib/theme';

type BannerState = BannerProps | null;

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile, saveProfile } = useProfile();
  const { mode, setMode } = useThemeMode();
  const colors = useColors();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const [firstName, setFirstName] = useState(profile?.first_name ?? '');
  const [lastName, setLastName] = useState(profile?.last_name ?? '');
  const [birthDate, setBirthDate] = useState<string | null>(profile?.birth_date ?? null);
  const [alias, setAlias] = useState(profile?.alias ?? '');
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState<BannerState>(null);

  async function handleSaveProfile() {
    setBanner(null);

    if (!firstName.trim() || !lastName.trim() || !alias.trim() || !birthDate) {
      setBanner({ type: 'error', message: 'Rellena todos los campos.' });
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
      setBanner({ type: 'success', message: 'Cambios guardados.' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ha ocurrido un error inesperado.';
      console.error('[settings]', message);
      setBanner({ type: 'error', message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backButton}>
          <ChevronLeftIcon size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Ajustes</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.sectionTitle}>Perfil</Text>
        <View style={styles.card}>
          {banner && <Banner type={banner.type} message={banner.message} />}

          <View style={styles.field}>
            <Text style={styles.label}>Nombre</Text>
            <TextInput
              style={styles.input}
              placeholderTextColor={colors.textMuted}
              value={firstName}
              onChangeText={setFirstName}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Apellido</Text>
            <TextInput
              style={styles.input}
              placeholderTextColor={colors.textMuted}
              value={lastName}
              onChangeText={setLastName}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Fecha de nacimiento</Text>
            <BirthDatePicker value={birthDate} onChange={setBirthDate} />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Alias</Text>
            <TextInput
              style={styles.input}
              placeholderTextColor={colors.textMuted}
              value={alias}
              onChangeText={setAlias}
            />
          </View>

          <SubmitButton title="Guardar cambios" loading={loading} onPress={handleSaveProfile} />
        </View>

        <Text style={styles.sectionTitle}>Preferencias</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Idioma</Text>
            <Text style={styles.rowValue}>Español</Text>
          </View>

          <View style={[styles.row, styles.rowLast]}>
            <Text style={styles.rowLabel}>Modo</Text>
            <View style={styles.modeToggle}>
              <ModeOption label="Claro" active={mode === 'light'} onPress={() => setMode('light')} colors={colors} />
              <ModeOption label="Oscuro" active={mode === 'dark'} onPress={() => setMode('dark')} colors={colors} />
            </View>
          </View>
        </View>

        <Pressable
          onPress={() => supabase.auth.signOut()}
          style={({ pressed }) => [styles.signOutButton, pressed && styles.signOutButtonPressed]}
        >
          <Text style={styles.signOutText}>Cerrar sesión</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ModeOption({
  label,
  active,
  onPress,
  colors,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  colors: ColorPalette;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles_modeOption.base,
        { backgroundColor: active ? colors.accent500 : 'transparent' },
      ]}
    >
      <Text
        style={[
          styles_modeOption.text,
          { color: active ? '#ffffff' : colors.textMuted },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles_modeOption = StyleSheet.create({
  base: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.pill,
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
  },
});

function getStyles(colors: ColorPalette) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    backButton: {
      width: 32,
      height: 32,
      alignItems: 'flex-start',
      justifyContent: 'center',
    },
    headerTitle: {
      flex: 1,
      textAlign: 'center',
      fontFamily: typography.fontFamily,
      fontWeight: typography.cardTitle.fontWeight,
      fontSize: 17,
      color: colors.textPrimary,
    },
    headerSpacer: {
      width: 32,
    },
    content: {
      paddingHorizontal: spacing.lg,
      maxWidth: 640,
      width: '100%',
      alignSelf: 'center',
    },
    sectionTitle: {
      fontFamily: typography.fontFamily,
      fontWeight: '700',
      fontSize: 13,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      color: colors.textMuted,
      marginTop: spacing.lg,
      marginBottom: spacing.sm,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radii.card,
      padding: spacing.lg,
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
      backgroundColor: colors.surfaceHover,
      borderRadius: radii.card,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      fontSize: 16,
      color: colors.textPrimary,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider2,
    },
    rowLast: {
      borderBottomWidth: 0,
    },
    rowLabel: {
      fontSize: 15,
      color: colors.textPrimary,
    },
    rowValue: {
      fontSize: 14,
      color: colors.textMuted,
    },
    modeToggle: {
      flexDirection: 'row',
      gap: 6,
      backgroundColor: colors.surfaceHover,
      borderRadius: radii.pill,
      padding: 3,
    },
    signOutButton: {
      marginTop: spacing.xl,
      borderWidth: 1,
      borderColor: colors.accent500,
      borderRadius: radii.card,
      paddingVertical: spacing.md,
      alignItems: 'center',
    },
    signOutButtonPressed: {
      backgroundColor: colors.accentSoftBg,
    },
    signOutText: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.accent500,
    },
  });
}
