import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CategoryFormSheet, type CategoryFormValues } from '../../../components/CategoryFormSheet';
import { ChevronLeftIcon, PlusIcon } from '../../../components/icons';
import { CATEGORY_COLORS, formatEuro } from '../../../lib/budgetUtils';
import { useColors } from '../../../lib/ThemeProvider';
import { radii, spacing, typography, type ColorPalette } from '../../../lib/theme';
import { useBudget, type BudgetCategory, type CategoryInput } from '../../../lib/useBudget';

export default function BudgetCategoriesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { categories, refresh, createCategory, updateCategory, deleteCategory } = useBudget();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<BudgetCategory | null>(null);

  function openCreateSheet() {
    setEditingCategory(null);
    setSheetOpen(true);
  }

  function openEditSheet(category: BudgetCategory) {
    setEditingCategory(category);
    setSheetOpen(true);
  }

  async function handleSubmit(values: CategoryInput) {
    if (editingCategory) {
      await updateCategory(editingCategory.id, values);
    } else {
      await createCategory(values);
    }
  }

  async function handleDelete() {
    if (!editingCategory) return;
    await deleteCategory(editingCategory.id);
  }

  const initialFormValues: CategoryFormValues = editingCategory
    ? {
        name: editingCategory.name,
        monthlyLimit: String(editingCategory.monthly_limit),
        color: editingCategory.color,
      }
    : { name: '', monthlyLimit: '', color: CATEGORY_COLORS[0] };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.headerButton}>
          <ChevronLeftIcon size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Categorías</Text>
        <Pressable onPress={openCreateSheet} hitSlop={8} style={styles.headerButton}>
          <PlusIcon size={22} color={colors.textPrimary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}>
        {categories.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Todavía no hay categorías</Text>
            <Text style={styles.emptySubtitle}>Toca el + de arriba para crear la primera.</Text>
          </View>
        )}

        {categories.map((category) => (
          <Pressable
            key={category.id}
            onPress={() => openEditSheet(category)}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          >
            <View style={[styles.colorDot, { backgroundColor: category.color }]} />
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{category.name}</Text>
              <Text style={styles.cardMeta}>Límite: {formatEuro(category.monthly_limit)}/mes</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>

      <CategoryFormSheet
        visible={sheetOpen}
        initialValues={initialFormValues}
        onClose={() => setSheetOpen(false)}
        onSubmit={handleSubmit}
        onDelete={editingCategory ? handleDelete : undefined}
      />
    </View>
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
    colorDot: {
      width: 14,
      height: 14,
      borderRadius: 7,
    },
    cardBody: {
      flex: 1,
    },
    cardTitle: {
      fontSize: typography.cardTitle.fontSize,
      fontWeight: typography.cardTitle.fontWeight,
      color: colors.textPrimary,
    },
    cardMeta: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
    },
  });
}
