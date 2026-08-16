import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import type { ComponentType } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NewListSheet } from '../../../components/NewListSheet';
import {
  ChevronLeftIcon,
  ListChecksIcon,
  LockIcon,
  PlusIcon,
  ShoppingBagIcon,
  TagIcon,
  UsersIcon,
  type IconProps,
} from '../../../components/icons';
import { useColors } from '../../../lib/ThemeProvider';
import { radii, spacing, typography, type ColorPalette } from '../../../lib/theme';
import { useLists, type ListCategory, type ListSummary } from '../../../lib/useLists';

type FilterKey = 'todas' | ListCategory;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'todas', label: 'Todas' },
  { key: 'compra', label: 'Compra' },
  { key: 'tareas', label: 'Tareas' },
  { key: 'otros', label: 'Otros' },
];

const CATEGORY_ICON: Record<ListCategory, ComponentType<IconProps>> = {
  compra: ShoppingBagIcon,
  tareas: ListChecksIcon,
  otros: TagIcon,
};

const CATEGORY_LABEL: Record<ListCategory, string> = {
  compra: 'Compra',
  tareas: 'Tareas',
  otros: 'Otros',
};

export default function ListsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { lists, isLoading, createList, refresh } = useLists();
  const [filter, setFilter] = useState<FilterKey>('todas');
  const [sheetOpen, setSheetOpen] = useState(false);

  // La pantalla se queda montada en la pila de navegación al entrar en el
  // detalle de una lista, así que sin esto los cambios hechos ahí (items
  // añadidos/marcados) no se reflejarían al volver.
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const filteredLists = useMemo(
    () => (filter === 'todas' ? lists : lists.filter((list) => list.category === filter)),
    [lists, filter]
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.headerButton}>
          <ChevronLeftIcon size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Listas</Text>
        <Pressable onPress={() => setSheetOpen(true)} hitSlop={8} style={styles.headerButton}>
          <PlusIcon size={22} color={colors.textPrimary} />
        </Pressable>
      </View>

      <View style={styles.filters}>
        {FILTERS.map(({ key, label }) => {
          const active = filter === key;
          return (
            <Pressable
              key={key}
              onPress={() => setFilter(key)}
              style={[styles.filterPill, active && styles.filterPillActive]}
            >
              <Text style={[styles.filterText, active && styles.filterTextActive]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}>
        {!isLoading && filteredLists.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>
              {filter === 'todas' ? 'Todavía no hay listas' : 'No hay listas en esta categoría'}
            </Text>
            <Text style={styles.emptySubtitle}>Toca el + de arriba para crear la primera.</Text>
          </View>
        )}

        {filteredLists.map((list) => (
          <ListCard key={list.id} list={list} onPress={() => router.push(`/lists/${list.id}`)} />
        ))}
      </ScrollView>

      <NewListSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} onCreate={createList} />
    </View>
  );
}

function ListCard({ list, onPress }: { list: ListSummary; onPress: () => void }) {
  const colors = useColors();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const CategoryIcon = CATEGORY_ICON[list.category];
  const VisibilityIcon = list.visibility === 'privada' ? LockIcon : UsersIcon;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.cardIcon}>
        <CategoryIcon size={20} color={colors.iconDefault} strokeWidth={1.75} />
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{list.name}</Text>
        <View style={styles.cardMetaRow}>
          <Text style={styles.cardMeta}>{CATEGORY_LABEL[list.category]}</Text>
          <View style={styles.cardMetaDivider} />
          <VisibilityIcon size={12} color={colors.textMuted} strokeWidth={2} />
          <Text style={styles.cardMeta}>{list.visibility === 'privada' ? 'Privada' : 'Compartida'}</Text>
        </View>
      </View>
      <View style={styles.cardCount}>
        <Text style={styles.cardCountNumber}>{list.pendingCount}</Text>
        <Text style={styles.cardCountLabel}>pendientes</Text>
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
    filters: {
      flexDirection: 'row',
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
    },
    filterPill: {
      paddingHorizontal: spacing.md,
      paddingVertical: 6,
      borderRadius: radii.pill,
      backgroundColor: colors.surface,
    },
    filterPillActive: {
      backgroundColor: colors.accent500,
    },
    filterText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textMuted,
    },
    filterTextActive: {
      color: '#ffffff',
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
      backgroundColor: colors.surfaceHover,
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
    cardCountNumber: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.accent500,
    },
    cardCountLabel: {
      fontSize: 10,
      color: colors.textMuted,
    },
  });
}
