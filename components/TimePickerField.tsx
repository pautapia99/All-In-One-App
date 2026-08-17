import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ClockIcon } from './icons';
import { useColors } from '../lib/ThemeProvider';
import { radii, spacing, typography, type ColorPalette } from '../lib/theme';

export type TimePickerFieldProps = {
  /** "HH:MM" (24h), or null if not set yet. */
  value: string | null;
  onChange: (time: string) => void;
  label: string;
};

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

function parseTime(value: string | null): { hour: number; minute: number } | null {
  if (!value) return null;
  const [hour, minute] = value.split(':').map(Number);
  if (Number.isFinite(hour) && Number.isFinite(minute)) return { hour, minute };
  return null;
}

function formatTime(hour: number, minute: number): string {
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}

export function TimePickerField({ value, onChange, label }: TimePickerFieldProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const parsed = parseTime(value);

  const [open, setOpen] = useState(false);
  const [hour, setHour] = useState(parsed?.hour ?? 9);
  const [minute, setMinute] = useState(parsed?.minute ?? 0);

  function openPicker() {
    setHour(parsed?.hour ?? 9);
    setMinute(parsed?.minute ?? 0);
    setOpen(true);
  }

  function confirm() {
    onChange(formatTime(hour, minute));
    setOpen(false);
  }

  return (
    <View>
      <Pressable onPress={openPicker} style={styles.field}>
        <ClockIcon size={16} color={colors.iconDefault} strokeWidth={1.75} />
        <Text style={[styles.fieldText, !parsed && styles.fieldPlaceholder]}>{value ?? '--:--'}</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable
            style={[styles.sheet, { paddingBottom: insets.bottom + spacing.md }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.handle} />
            <View style={styles.titleRow}>
              <Text style={styles.title}>{label}</Text>
              <Pressable onPress={confirm} hitSlop={8}>
                <Text style={styles.doneText}>Listo</Text>
              </Pressable>
            </View>

            <View style={styles.columns}>
              <ScrollView style={styles.column} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                {HOURS.map((h) => (
                  <Pressable key={h} onPress={() => setHour(h)} style={styles.optionRow}>
                    <View style={[styles.optionPill, hour === h && styles.optionPillActive]}>
                      <Text style={[styles.optionText, hour === h && styles.optionTextActive]}>
                        {h.toString().padStart(2, '0')}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
              <Text style={styles.colon}>:</Text>
              <ScrollView style={styles.column} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                {MINUTES.map((m) => (
                  <Pressable key={m} onPress={() => setMinute(m)} style={styles.optionRow}>
                    <View style={[styles.optionPill, minute === m && styles.optionPillActive]}>
                      <Text style={[styles.optionText, minute === m && styles.optionTextActive]}>
                        {m.toString().padStart(2, '0')}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function getStyles(colors: ColorPalette) {
  return StyleSheet.create({
    field: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.surfaceHover,
      borderRadius: radii.card,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    fieldText: {
      fontSize: 15,
      color: colors.textPrimary,
    },
    fieldPlaceholder: {
      color: colors.textMuted,
    },
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
    doneText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.accent500,
    },
    columns: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
    },
    column: {
      maxHeight: 220,
      width: 72,
    },
    colon: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    optionRow: {
      paddingVertical: 4,
    },
    optionPill: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.sm,
      borderRadius: radii.card,
      backgroundColor: colors.surfaceHover,
    },
    optionPillActive: {
      backgroundColor: colors.accent500,
    },
    optionText: {
      fontSize: 14,
      color: colors.textPrimary,
    },
    optionTextActive: {
      color: '#ffffff',
      fontWeight: '700',
    },
  });
}
