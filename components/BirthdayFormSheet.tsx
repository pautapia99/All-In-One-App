import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Banner, type BannerProps } from './Banner';
import { CalendarDatePicker } from './CalendarDatePicker';
import { ConfirmModal } from './ConfirmModal';
import { SubmitButton } from './SubmitButton';
import { TrashIcon } from './icons';
import { useColors } from '../lib/ThemeProvider';
import { radii, spacing, typography, type ColorPalette } from '../lib/theme';
import { UNKNOWN_BIRTH_YEAR } from '../lib/useBirthdays';

export type BirthdayFormValues = {
  name: string;
  /** Just what to preselect in the date picker (null = nothing picked yet);
   *  the year is discarded at submit time when `knowsYear` is false, so it
   *  never has to be the real (unknown) birth year. */
  dateIso: string | null;
  knowsYear: boolean;
};

export type BirthdayFormSheetProps = {
  visible: boolean;
  initialValues: BirthdayFormValues;
  onClose: () => void;
  onSubmit: (values: { name: string; birthDate: string }) => Promise<void>;
  onDelete?: () => Promise<void>;
};

type BannerState = BannerProps | null;

export function BirthdayFormSheet({ visible, initialValues, onClose, onSubmit, onDelete }: BirthdayFormSheetProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const isEdit = !!onDelete;

  const [name, setName] = useState(initialValues.name);
  const [dateIso, setDateIso] = useState<string | null>(initialValues.dateIso);
  const [knowsYear, setKnowsYear] = useState(initialValues.knowsYear);
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [banner, setBanner] = useState<BannerState>(null);

  // Only reset when the sheet actually opens — see EventFormSheet for why
  // resetting on every `initialValues` change would wipe out user input.
  useEffect(() => {
    if (!visible) return;
    setName(initialValues.name);
    setDateIso(initialValues.dateIso);
    setKnowsYear(initialValues.knowsYear);
    setBanner(null);
    setConfirmDelete(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  function handleClose() {
    onClose();
  }

  async function handleSubmit() {
    if (!name.trim()) {
      setBanner({ type: 'error', message: 'Escribe un nombre.' });
      return;
    }
    if (!dateIso) {
      setBanner({ type: 'error', message: 'Elige una fecha.' });
      return;
    }

    const [, month, day] = dateIso.split('-');
    const birthDate = knowsYear ? dateIso : `${UNKNOWN_BIRTH_YEAR}-${month}-${day}`;

    setLoading(true);
    setBanner(null);
    try {
      await onSubmit({ name: name.trim(), birthDate });
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ha ocurrido un error inesperado.';
      console.error('[birthday-form]', message);
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
      console.error('[birthday-form] delete', message);
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
                <Text style={styles.title}>{isEdit ? 'Editar cumpleaños' : 'Nuevo cumpleaños'}</Text>
                <Pressable onPress={handleClose} hitSlop={8}>
                  <Text style={styles.closeText}>Cerrar</Text>
                </Pressable>
              </View>

              {banner && <Banner type={banner.type} message={banner.message} />}

              <Text style={styles.label}>Nombre</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej. Nora"
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={setName}
              />

              <Text style={styles.label}>Fecha</Text>
              <CalendarDatePicker value={dateIso} onChange={setDateIso} />

              <Pressable style={styles.yearRow} onPress={() => setKnowsYear((prev) => !prev)}>
                <View style={styles.yearRowText}>
                  <Text style={styles.yearLabel}>Sé el año de nacimiento</Text>
                  {!knowsYear && <Text style={styles.yearHint}>No se mostrará la edad que cumple.</Text>}
                </View>
                {/* pointerEvents="none": toggling goes through the row's onPress
                    above, so a tap landing on the switch doesn't double-fire. */}
                <View pointerEvents="none">
                  <Switch
                    value={knowsYear}
                    onValueChange={setKnowsYear}
                    trackColor={{ true: colors.accent500, false: colors.surfaceHover }}
                    thumbColor="#ffffff"
                  />
                </View>
              </Pressable>

              <View style={styles.submitWrapper}>
                <SubmitButton
                  title={isEdit ? 'Guardar cambios' : 'Añadir cumpleaños'}
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
                  <Text style={styles.deleteText}>Eliminar cumpleaños</Text>
                </Pressable>
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <ConfirmModal
        visible={confirmDelete}
        title="¿Eliminar este cumpleaños?"
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
    yearRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: spacing.lg,
      gap: spacing.sm,
    },
    yearRowText: {
      flex: 1,
    },
    yearLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    yearHint: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
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
