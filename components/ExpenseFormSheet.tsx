import { useEffect, useMemo, useState } from 'react';
import type { ComponentType } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Banner, type BannerProps } from './Banner';
import { CalendarDatePicker } from './CalendarDatePicker';
import { ConfirmModal } from './ConfirmModal';
import { SubmitButton } from './SubmitButton';
import { LockIcon, TrashIcon, UsersIcon, type IconProps } from './icons';
import type { BudgetCategory, ExpenseVisibility } from '../lib/useBudget';
import { useColors } from '../lib/ThemeProvider';
import { radii, spacing, typography, type ColorPalette } from '../lib/theme';

export type ExpenseFormValues = {
  concept: string;
  amount: string;
  dateIso: string | null;
  categoryId: string;
  visibility: ExpenseVisibility;
};

export type ExpenseFormSheetProps = {
  visible: boolean;
  categories: BudgetCategory[];
  initialValues: ExpenseFormValues;
  onClose: () => void;
  onSubmit: (values: { concept: string; amount: number; expenseDate: string; categoryId: string; visibility: ExpenseVisibility }) => Promise<void>;
  onDelete?: () => Promise<void>;
};

const VISIBILITY_OPTIONS: { value: ExpenseVisibility; label: string; icon: ComponentType<IconProps> }[] = [
  { value: 'privado', label: 'Privado', icon: LockIcon },
  { value: 'compartido', label: 'Compartido', icon: UsersIcon },
];

type BannerState = BannerProps | null;

export function ExpenseFormSheet({
  visible,
  categories,
  initialValues,
  onClose,
  onSubmit,
  onDelete,
}: ExpenseFormSheetProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const isEdit = !!onDelete;

  const [concept, setConcept] = useState(initialValues.concept);
  const [amount, setAmount] = useState(initialValues.amount);
  const [dateIso, setDateIso] = useState<string | null>(initialValues.dateIso);
  const [categoryId, setCategoryId] = useState(initialValues.categoryId);
  const [visibility, setVisibility] = useState<ExpenseVisibility>(initialValues.visibility);
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [banner, setBanner] = useState<BannerState>(null);

  // Only reset when the sheet actually opens — see EventFormSheet for why.
  useEffect(() => {
    if (!visible) return;
    setConcept(initialValues.concept);
    setAmount(initialValues.amount);
    setDateIso(initialValues.dateIso);
    setCategoryId(initialValues.categoryId);
    setVisibility(initialValues.visibility);
    setBanner(null);
    setConfirmDelete(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  function handleClose() {
    onClose();
  }

  async function handleSubmit() {
    if (!concept.trim()) {
      setBanner({ type: 'error', message: 'Escribe un concepto para el gasto.' });
      return;
    }
    const normalized = amount.trim().replace(',', '.');
    const amountValue = Number(normalized);
    if (!normalized || Number.isNaN(amountValue) || amountValue <= 0) {
      setBanner({ type: 'error', message: 'Escribe un importe válido.' });
      return;
    }
    if (!dateIso) {
      setBanner({ type: 'error', message: 'Elige una fecha.' });
      return;
    }
    if (!categoryId) {
      setBanner({ type: 'error', message: 'Elige una categoría.' });
      return;
    }

    setLoading(true);
    setBanner(null);
    try {
      await onSubmit({ concept: concept.trim(), amount: amountValue, expenseDate: dateIso, categoryId, visibility });
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ha ocurrido un error inesperado.';
      console.error('[expense-form]', message);
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
      console.error('[expense-form] delete', message);
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
                <Text style={styles.title}>{isEdit ? 'Editar gasto' : 'Nuevo gasto'}</Text>
                <Pressable onPress={handleClose} hitSlop={8}>
                  <Text style={styles.closeText}>Cerrar</Text>
                </Pressable>
              </View>

              {banner && <Banner type={banner.type} message={banner.message} />}

              <Text style={styles.label}>Concepto</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej. Compra semanal"
                placeholderTextColor={colors.textMuted}
                value={concept}
                onChangeText={setConcept}
              />

              <Text style={styles.label}>Importe</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej. 45,50"
                placeholderTextColor={colors.textMuted}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
              />

              <Text style={styles.label}>Fecha</Text>
              <CalendarDatePicker value={dateIso} onChange={setDateIso} />

              <Text style={styles.label}>Categoría</Text>
              <View style={styles.categoriesRow}>
                {categories.map((category) => {
                  const active = categoryId === category.id;
                  return (
                    <Pressable
                      key={category.id}
                      onPress={() => setCategoryId(category.id)}
                      style={[
                        styles.categoryPill,
                        { backgroundColor: active ? category.color : colors.surfaceHover },
                      ]}
                    >
                      <View style={[styles.categoryDot, { backgroundColor: active ? '#ffffff' : category.color }]} />
                      <Text style={[styles.categoryPillText, active && styles.categoryPillTextActive]}>
                        {category.name}
                      </Text>
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
                <SubmitButton
                  title={isEdit ? 'Guardar cambios' : 'Añadir gasto'}
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
                  <Text style={styles.deleteText}>Eliminar gasto</Text>
                </Pressable>
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <ConfirmModal
        visible={confirmDelete}
        title="¿Eliminar este gasto?"
        message="Esta acción no se puede deshacer."
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
    categoriesRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    categoryPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radii.pill,
    },
    categoryDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    categoryPillText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    categoryPillTextActive: {
      color: '#ffffff',
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
