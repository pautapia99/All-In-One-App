import { useEffect, useMemo, useState } from 'react';
import type { ComponentType } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Banner, type BannerProps } from './Banner';
import { CalendarDatePicker } from './CalendarDatePicker';
import { ConfirmModal } from './ConfirmModal';
import { SubmitButton } from './SubmitButton';
import { TimePickerField } from './TimePickerField';
import { LockIcon, TrashIcon, UsersIcon, type IconProps } from './icons';
import { useColors } from '../lib/ThemeProvider';
import { radii, spacing, typography, type ColorPalette } from '../lib/theme';
import type { EventVisibility } from '../lib/useEvents';

export type EventFormValues = {
  title: string;
  dateIso: string;
  isAllDay: boolean;
  startTime: string;
  endTime: string;
  visibility: EventVisibility;
};

export type EventFormSheetProps = {
  visible: boolean;
  initialValues: EventFormValues;
  onClose: () => void;
  onSubmit: (values: EventFormValues) => Promise<void>;
  /** Only passed in edit mode; its presence is what switches the sheet's title/copy. */
  onDelete?: () => Promise<void>;
};

const VISIBILITY_OPTIONS: { value: EventVisibility; label: string; icon: ComponentType<IconProps> }[] = [
  { value: 'privado', label: 'Privado', icon: LockIcon },
  { value: 'compartido', label: 'Compartido', icon: UsersIcon },
];

type BannerState = BannerProps | null;

export function EventFormSheet({ visible, initialValues, onClose, onSubmit, onDelete }: EventFormSheetProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const isEdit = !!onDelete;

  const [title, setTitle] = useState(initialValues.title);
  const [dateIso, setDateIso] = useState<string | null>(initialValues.dateIso);
  const [isAllDay, setIsAllDay] = useState(initialValues.isAllDay);
  const [startTime, setStartTime] = useState<string | null>(initialValues.startTime);
  const [endTime, setEndTime] = useState<string | null>(initialValues.endTime);
  const [visibility, setVisibility] = useState<EventVisibility>(initialValues.visibility);
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [banner, setBanner] = useState<BannerState>(null);

  // Only reset the form when the sheet actually opens, not on every re-render
  // while it's open — `initialValues` is a fresh object each render, and
  // resetting on every change would wipe out whatever the user is typing.
  useEffect(() => {
    if (!visible) return;
    setTitle(initialValues.title);
    setDateIso(initialValues.dateIso);
    setIsAllDay(initialValues.isAllDay);
    setStartTime(initialValues.startTime);
    setEndTime(initialValues.endTime);
    setVisibility(initialValues.visibility);
    setBanner(null);
    setConfirmDelete(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  function handleClose() {
    onClose();
  }

  async function handleSubmit() {
    if (!title.trim()) {
      setBanner({ type: 'error', message: 'Escribe un título para el evento.' });
      return;
    }
    if (!dateIso) {
      setBanner({ type: 'error', message: 'Elige una fecha.' });
      return;
    }
    if (!isAllDay && (!startTime || !endTime || endTime <= startTime)) {
      setBanner({ type: 'error', message: 'Elige una hora de fin posterior a la de inicio.' });
      return;
    }

    setLoading(true);
    setBanner(null);
    try {
      await onSubmit({
        title: title.trim(),
        dateIso,
        isAllDay,
        startTime: startTime ?? '09:00',
        endTime: endTime ?? '10:00',
        visibility,
      });
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ha ocurrido un error inesperado.';
      console.error('[event-form]', message);
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
      console.error('[event-form] delete', message);
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
                <Text style={styles.title}>{isEdit ? 'Editar evento' : 'Nuevo evento'}</Text>
                <Pressable onPress={handleClose} hitSlop={8}>
                  <Text style={styles.closeText}>Cerrar</Text>
                </Pressable>
              </View>

              {banner && <Banner type={banner.type} message={banner.message} />}

              <Text style={styles.label}>Título</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej. Cena en casa de la abuela"
                placeholderTextColor={colors.textMuted}
                value={title}
                onChangeText={setTitle}
              />

              <Text style={styles.label}>Fecha</Text>
              <CalendarDatePicker value={dateIso} onChange={setDateIso} />

              <Pressable style={styles.allDayRow} onPress={() => setIsAllDay((prev) => !prev)}>
                <Text style={styles.allDayLabel}>Todo el día</Text>
                {/* pointerEvents="none": toggling goes through the row's onPress above,
                    so a tap landing on the switch itself doesn't fire both handlers
                    and cancel itself out. */}
                <View pointerEvents="none">
                  <Switch
                    value={isAllDay}
                    onValueChange={setIsAllDay}
                    trackColor={{ true: colors.accent500, false: colors.surfaceHover }}
                    thumbColor="#ffffff"
                  />
                </View>
              </Pressable>

              {!isAllDay && (
                <View style={styles.timeRow}>
                  <View style={styles.timeField}>
                    <Text style={styles.label}>Empieza</Text>
                    <TimePickerField value={startTime} onChange={setStartTime} label="Hora de inicio" />
                  </View>
                  <View style={styles.timeField}>
                    <Text style={styles.label}>Termina</Text>
                    <TimePickerField value={endTime} onChange={setEndTime} label="Hora de fin" />
                  </View>
                </View>
              )}

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
                  title={isEdit ? 'Guardar cambios' : 'Crear evento'}
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
                  <Text style={styles.deleteText}>Eliminar evento</Text>
                </Pressable>
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <ConfirmModal
        visible={confirmDelete}
        title="¿Eliminar este evento?"
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
    allDayRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: spacing.lg,
    },
    allDayLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    timeRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    timeField: {
      flex: 1,
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
