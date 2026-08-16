import { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Banner, type BannerProps } from './Banner';
import { SubmitButton } from './SubmitButton';
import {
  LockIcon,
  ShoppingBagIcon,
  TagIcon,
  UsersIcon,
  ListChecksIcon,
  type IconProps,
} from './icons';
import { useColors } from '../lib/ThemeProvider';
import { radii, spacing, typography, type ColorPalette } from '../lib/theme';
import type { ListCategory, ListVisibility, NewListInput } from '../lib/useLists';
import type { ComponentType } from 'react';

export type NewListSheetProps = {
  visible: boolean;
  onClose: () => void;
  onCreate: (input: NewListInput) => Promise<void>;
};

const CATEGORY_OPTIONS: { value: ListCategory; label: string; icon: ComponentType<IconProps> }[] = [
  { value: 'compra', label: 'Compra', icon: ShoppingBagIcon },
  { value: 'tareas', label: 'Tareas', icon: ListChecksIcon },
  { value: 'otros', label: 'Otros', icon: TagIcon },
];

const VISIBILITY_OPTIONS: { value: ListVisibility; label: string; icon: ComponentType<IconProps> }[] = [
  { value: 'privada', label: 'Privada', icon: LockIcon },
  { value: 'compartida', label: 'Compartida', icon: UsersIcon },
];

type BannerState = BannerProps | null;

export function NewListSheet({ visible, onClose, onCreate }: NewListSheetProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const [name, setName] = useState('');
  const [category, setCategory] = useState<ListCategory>('compra');
  const [visibility, setVisibility] = useState<ListVisibility>('compartida');
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState<BannerState>(null);

  function reset() {
    setName('');
    setCategory('compra');
    setVisibility('compartida');
    setBanner(null);
    setLoading(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSubmit() {
    if (!name.trim()) {
      setBanner({ type: 'error', message: 'Escribe un nombre para la lista.' });
      return;
    }
    setLoading(true);
    setBanner(null);
    try {
      await onCreate({ name: name.trim(), category, visibility });
      reset();
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ha ocurrido un error inesperado.';
      console.error('[new-list]', message);
      setBanner({ type: 'error', message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Pressable
          style={[styles.sheet, { paddingBottom: insets.bottom + spacing.md }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.handle} />
          <View style={styles.titleRow}>
            <Text style={styles.title}>Nueva lista</Text>
            <Pressable onPress={handleClose} hitSlop={8}>
              <Text style={styles.closeText}>Cerrar</Text>
            </Pressable>
          </View>

          {banner && <Banner type={banner.type} message={banner.message} />}

          <Text style={styles.label}>Nombre</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej. Compra semanal"
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
            autoFocus
          />

          <Text style={styles.label}>Categoría</Text>
          <View style={styles.optionsRow}>
            {CATEGORY_OPTIONS.map(({ value, label, icon: Icon }) => {
              const active = category === value;
              return (
                <Pressable
                  key={value}
                  onPress={() => setCategory(value)}
                  style={[styles.option, active && styles.optionActive]}
                >
                  <Icon size={16} color={active ? '#ffffff' : colors.iconDefault} strokeWidth={1.75} />
                  <Text style={[styles.optionText, active && styles.optionTextActive]}>{label}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.label}>Visibilidad</Text>
          <View style={styles.optionsRow}>
            {VISIBILITY_OPTIONS.map(({ value, label, icon: Icon }) => {
              const active = visibility === value;
              return (
                <Pressable
                  key={value}
                  onPress={() => setVisibility(value)}
                  style={[styles.option, active && styles.optionActive]}
                >
                  <Icon size={16} color={active ? '#ffffff' : colors.iconDefault} strokeWidth={1.75} />
                  <Text style={[styles.optionText, active && styles.optionTextActive]}>{label}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.submitWrapper}>
            <SubmitButton title="Crear lista" loading={loading} onPress={handleSubmit} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function getStyles(colors: ColorPalette) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: radii.card,
      borderTopRightRadius: radii.card,
      padding: spacing.lg,
      maxWidth: 480,
      width: '100%',
      alignSelf: 'center',
    },
    handle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.divider,
      alignSelf: 'center',
      marginBottom: spacing.md,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.md,
    },
    title: {
      fontFamily: typography.fontFamily,
      fontWeight: '700',
      fontSize: 16,
      color: colors.textPrimary,
    },
    closeText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.accent500,
    },
    label: {
      fontSize: 12,
      color: colors.textMuted,
      marginBottom: 6,
      marginTop: spacing.sm,
    },
    input: {
      backgroundColor: colors.surfaceHover,
      borderRadius: radii.card,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      fontSize: 16,
      color: colors.textPrimary,
    },
    optionsRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    option: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: spacing.sm + 2,
      borderRadius: radii.card,
      backgroundColor: colors.surfaceHover,
    },
    optionActive: {
      backgroundColor: colors.accent500,
    },
    optionText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    optionTextActive: {
      color: '#ffffff',
    },
    submitWrapper: {
      marginTop: spacing.lg,
    },
  });
}
