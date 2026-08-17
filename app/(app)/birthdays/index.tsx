import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BirthdayFormSheet, type BirthdayFormValues } from '../../../components/BirthdayFormSheet';
import { ChevronLeftIcon, GiftIcon, PlusIcon, UserPlusIcon, UsersIcon } from '../../../components/icons';
import { useColors } from '../../../lib/ThemeProvider';
import { useBirthdays, type BirthdayEntry } from '../../../lib/useBirthdays';
import { radii, spacing, typography, type ColorPalette } from '../../../lib/theme';

const MONTH_NAMES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

const CURRENT_YEAR = new Date().getFullYear();

function formatDayMonth(dateIso: string): string {
  const [, month, day] = dateIso.split('-').map(Number);
  return `${day} de ${MONTH_NAMES[month - 1]}`;
}

function countdownLabel(daysUntil: number): string {
  if (daysUntil === 0) return '¡Hoy!';
  if (daysUntil === 1) return 'Mañana';
  return `En ${daysUntil} días`;
}

export default function BirthdaysScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { entries, isLoading, refresh, createBirthday, updateBirthday, deleteBirthday } = useBirthdays();

  // Igual que en Listas/Calendario: la pantalla queda montada al abrir el
  // formulario, así que sin esto los cambios no se reflejarían al volver.
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<BirthdayEntry | null>(null);

  function openCreateSheet() {
    setEditingEntry(null);
    setSheetOpen(true);
  }

  function openEditSheet(entry: BirthdayEntry) {
    if (entry.source !== 'manual') return;
    setEditingEntry(entry);
    setSheetOpen(true);
  }

  async function handleSubmit(values: { name: string; birthDate: string }) {
    if (editingEntry) {
      await updateBirthday(editingEntry.id, values);
    } else {
      await createBirthday(values);
    }
  }

  async function handleDelete() {
    if (!editingEntry) return;
    await deleteBirthday(editingEntry.id);
  }

  const initialFormValues: BirthdayFormValues = editingEntry
    ? {
        name: editingEntry.name,
        dateIso: editingEntry.hasYear
          ? editingEntry.birthDate
          : `${CURRENT_YEAR}-${editingEntry.birthDate.slice(5)}`,
        knowsYear: editingEntry.hasYear,
      }
    : { name: '', dateIso: null, knowsYear: true };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.headerButton}>
          <ChevronLeftIcon size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Cumpleaños</Text>
        <Pressable onPress={openCreateSheet} hitSlop={8} style={styles.headerButton}>
          <PlusIcon size={22} color={colors.textPrimary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}>
        {!isLoading && entries.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Todavía no hay cumpleaños</Text>
            <Text style={styles.emptySubtitle}>Toca el + de arriba para añadir el primero.</Text>
          </View>
        )}

        {entries.map((entry) => (
          <BirthdayRow
            key={`${entry.source}-${entry.id}`}
            entry={entry}
            onPress={entry.source === 'manual' ? () => openEditSheet(entry) : undefined}
          />
        ))}
      </ScrollView>

      <BirthdayFormSheet
        visible={sheetOpen}
        initialValues={initialFormValues}
        onClose={() => setSheetOpen(false)}
        onSubmit={handleSubmit}
        onDelete={editingEntry ? handleDelete : undefined}
      />
    </View>
  );
}

function BirthdayRow({ entry, onPress }: { entry: BirthdayEntry; onPress?: () => void }) {
  const colors = useColors();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const SourceIcon = entry.source === 'member' ? UsersIcon : UserPlusIcon;
  const sourceLabel = entry.source === 'member' ? 'De la familia' : 'Añadido';

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.card, pressed && !!onPress && styles.cardPressed]}
    >
      <View style={styles.cardIcon}>
        <GiftIcon size={20} color={colors.iconDefault} strokeWidth={1.75} />
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{entry.name}</Text>
        <View style={styles.cardMetaRow}>
          <Text style={styles.cardMeta}>{formatDayMonth(entry.birthDate)}</Text>
          <View style={styles.cardMetaDivider} />
          <SourceIcon size={12} color={colors.textMuted} strokeWidth={2} />
          <Text style={styles.cardMeta}>{sourceLabel}</Text>
        </View>
      </View>
      <View style={styles.cardCount}>
        <Text style={[styles.cardCountLabel, entry.daysUntil === 0 && styles.cardCountToday]}>
          {countdownLabel(entry.daysUntil)}
        </Text>
        {entry.turningAge !== null && <Text style={styles.cardCountAge}>Cumple {entry.turningAge}</Text>}
      </View>
    </Pressable>
  );
}

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
    headerButton: {
      width: 32,
      height: 32,
      alignItems: 'center',
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
    content: {
      paddingHorizontal: spacing.lg,
      maxWidth: 640,
      width: '100%',
      alignSelf: 'center',
      gap: spacing.sm,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: spacing.xxl,
    },
    emptyTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },
    emptySubtitle: {
      fontSize: 13,
      color: colors.textMuted,
    },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: radii.card,
      padding: spacing.lg,
    },
    cardPressed: {
      backgroundColor: colors.surfaceHover,
    },
    cardIcon: {
      width: 44,
      height: 44,
      borderRadius: radii.icon,
      backgroundColor: colors.accentSoftBg,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    cardBody: {
      flex: 1,
    },
    cardTitle: {
      fontSize: typography.cardTitle.fontSize,
      fontWeight: typography.cardTitle.fontWeight,
      color: colors.textPrimary,
    },
    cardMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 4,
    },
    cardMeta: {
      fontSize: 12,
      color: colors.textMuted,
    },
    cardMetaDivider: {
      width: 3,
      height: 3,
      borderRadius: 1.5,
      backgroundColor: colors.textMuted,
    },
    cardCount: {
      alignItems: 'flex-end',
    },
    cardCountLabel: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.accent500,
    },
    cardCountToday: {
      color: colors.accent500,
    },
    cardCountAge: {
      fontSize: 10,
      color: colors.textMuted,
      marginTop: 2,
    },
  });
}
