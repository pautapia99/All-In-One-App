import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Banner, type BannerProps } from './Banner';
import { ConfirmModal } from './ConfirmModal';
import { SubmitButton } from './SubmitButton';
import { CheckIcon, TrashIcon } from './icons';
import { CATEGORY_COLORS } from '../lib/budgetUtils';
import { useColors } from '../lib/ThemeProvider';
import { radii, spacing, typography, type ColorPalette } from '../lib/theme';

export type CategoryFormValues = {
  name: string;
  monthlyLimit: string;
  color: string;
};

export type CategoryFormSheetProps = {
  visible: boolean;
  initialValues: CategoryFormValues;
  onClose: () => void;
  onSubmit: (values: { name: string; monthlyLimit: number; color: string }) => Promise<void>;
  onDelete?: () => Promise<void>;
};

type BannerState = BannerProps | null;

export function CategoryFormSheet({ visible, initialValues, onClose, onSubmit, onDelete }: CategoryFormSheetProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const isEdit = !!onDelete;

  const [name, setName] = useState(initialValues.name);
  const [monthlyLimit, setMonthlyLimit] = useState(initialValues.monthlyLimit);
  const [color, setColor] = useState(initialValues.color);
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [banner, setBanner] = useState<BannerState>(null);

  // Only reset when the sheet actually opens — see EventFormSheet for why.
  useEffect(() => {
    if (!visible) return;
    setName(initialValues.name);
    setMonthlyLimit(initialValues.monthlyLimit);
    setColor(initialValues.color);
    setBanner(null);
    setConfirmDelete(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  function handleClose() {
    onClose();
  }

  async function handleSubmit() {
    if (!name.trim()) {
      setBanner({ type: 'error', message: 'Escribe un nombre para la categoría.' });
      return;
    }
    const normalized = monthlyLimit.trim().replace(',', '.');
    const limitValue = Number(normalized);
    if (!normalized || Number.isNaN(limitValue) || limitValue < 0) {
      setBanner({ type: 'error', message: 'Escribe un límite mensual válido.' });
      return;
    }

    setLoading(true);
    setBanner(null);
    try {
      await onSubmit({ name: name.trim(), monthlyLimit: limitValue, color });
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ha ocurrido un error inesperado.';
      console.error('[category-form]', message);
      setBanner({ type: 'error', message });
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmDelete() {
    if (!onDelete) return;
    setConfirmDelete(false);
    setLoading(true);
    try {
      await onDelete();
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ha ocurrido un error inesperado.';
      console.error('[category-form] delete', message);
      setBanner({ type: 'error', message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
        <Pressable style={styles.backdrop} onPress={handleClose}>
          <Pressable
            style={[styles.sheet, { paddingBottom: insets.bottom + spacing.md }]}
            onPress={(e) => e.stopPropagation()}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.handle} />
              <View style={styles.titleRow}>
                <Text style={styles.title}>{isEdit ? 'Editar categoría' : 'Nueva categoría'}</Text>
                <Pressable onPress={handleClose} hitSlop={8}>
                  <Text style={styles.closeText}>Cerrar</Text>
                </Pressable>
              </View>

              {banner && <Banner type={banner.type} message={banner.message} />}

              <Text style={styles.label}>Nombre</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej. Comida"
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={setName}
              />

              <Text style={styles.label}>Límite mensual</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej. 250"
                placeholderTextColor={colors.textMuted}
                value={monthlyLimit}
                onChangeText={setMonthlyLimit}
                keyboardType="decimal-pad"
              />

              <Text style={styles.label}>Color</Text>
              <View style={styles.colorsRow}>
                {CATEGORY_COLORS.map((option) => {
                  const active = color === option;
                  return (
                    <Pressable
                      key={option}
                      onPress={() => setColor(option)}
                      style={[styles.colorSwatch, { backgroundColor: option }]}
                    >
                      {active && <CheckIcon size={16} color="#ffffff" strokeWidth={3} />}
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.submitWrapper}>
                <SubmitButton
                  title={isEdit ? 'Guardar cambios' : 'Crear categoría'}
                  loading={loading}
                  onPress={handleSubmit}
                />
              </View>

              {isEdit && (
                <Pressable
                  onPress={() => setConfirmDelete(true)}
                  style={({ pressed }) => [styles.deleteButton, pressed && styles.deleteButtonPressed]}
                  hitSlop={8}
                >
                  <TrashIcon size={16} color={colors.textMuted} strokeWidth={1.75} />
                  <Text style={styles.deleteText}>Eliminar categoría</Text>
                </Pressable>
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <ConfirmModal
        visible={confirmDelete}
        title="¿Eliminar esta categoría?"
        message="También se borrarán todos sus gastos. Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
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
      maxHeight: '85%',
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
    colorsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    colorSwatch: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    submitWrapper: {
      marginTop: spacing.lg,
    },
    deleteButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      marginTop: spacing.md,
      paddingVertical: spacing.sm,
    },
    deleteButtonPressed: {
      opacity: 0.6,
    },
    deleteText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textMuted,
    },
  });
}
