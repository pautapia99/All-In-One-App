import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ExpenseFormSheet, type ExpenseFormValues } from '../../../components/ExpenseFormSheet';
import { ProgressBar } from '../../../components/ProgressBar';
import { ChevronLeftIcon, PlusIcon, SettingsIcon } from '../../../components/icons';
import { formatEuro } from '../../../lib/budgetUtils';
import { useColors } from '../../../lib/ThemeProvider';
import { radii, spacing, typography, type ColorPalette } from '../../../lib/theme';
import { useBudget, type CategorySummary, type ExpenseInput } from '../../../lib/useBudget';

export default function BudgetScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { categories, categorySummaries, totalSpent, totalLimit, refresh, createExpense } = useBudget();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const [sheetOpen, setSheetOpen] = useState(false);

  async function handleSubmit(values: ExpenseInput) {
    await createExpense(values);
  }

  const initialFormValues: ExpenseFormValues = {
    concept: '',
    amount: '',
    dateIso: null,
    categoryId: categories[0]?.id ?? '',
    visibility: 'compartido',
  };

  const overBudget = totalLimit > 0 && totalSpent > totalLimit;

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.headerButton}>
          <ChevronLeftIcon size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Presupuesto</Text>
        <View style={styles.headerActions}>
          <Pressable onPress={() => router.push('/budget/categories')} hitSlop={8} style={styles.headerButton}>
            <SettingsIcon size={19} color={colors.textPrimary} strokeWidth={1.75} />
          </Pressable>
          <Pressable
            onPress={() => setSheetOpen(true)}
            hitSlop={8}
            style={styles.headerButton}
            disabled={categories.length === 0}
          >
            <PlusIcon size={22} color={categories.length === 0 ? colors.textMuted : colors.textPrimary} />
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Gastado este mes</Text>
          <Text style={styles.summaryAmount}>
            {formatEuro(totalSpent)}
            <Text style={styles.summaryLimit}> / {formatEuro(totalLimit)}</Text>
          </Text>
          <View style={styles.summaryBarWrap}>
            <ProgressBar
              progress={totalLimit > 0 ? totalSpent / totalLimit : 0}
              color={overBudget ? colors.accent600 : colors.accent500}
              height={10}
            />
          </View>
        </View>

        {categories.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Todavía no hay categorías</Text>
            <Text style={styles.emptySubtitle}>
              Crea la primera categoría para poder empezar a añadir gastos.
            </Text>
            <Pressable
              onPress={() => router.push('/budget/categories')}
              style={({ pressed }) => [styles.emptyButton, pressed && styles.emptyButtonPressed]}
            >
              <Text style={styles.emptyButtonText}>Crear categoría</Text>
            </Pressable>
          </View>
        ) : (
          categorySummaries.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              onPress={() => router.push(`/budget/${category.id}`)}
            />
          ))
        )}
      </ScrollView>

      <ExpenseFormSheet
        visible={sheetOpen}
        categories={categories}
        initialValues={initialFormValues}
        onClose={() => setSheetOpen(false)}
        onSubmit={handleSubmit}
      />
    </View>
  );
}

function CategoryCard({ category, onPress }: { category: CategorySummary; onPress: () => void }) {
  const colors = useColors();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const overLimit = category.monthly_limit > 0 && category.spent > category.monthly_limit;
  const progress =
    category.monthly_limit > 0 ? category.spent / category.monthly_limit : category.spent > 0 ? 1 : 0;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.categoryCard, pressed && styles.categoryCardPressed]}
    >
      <View style={styles.categoryCardHeader}>
        <View style={styles.categoryCardTitleRow}>
          <View style={[styles.colorDot, { backgroundColor: category.color }]} />
          <Text style={styles.categoryCardTitle}>{category.name}</Text>
        </View>
        <Text style={[styles.categoryCardAmount, overLimit && styles.categoryCardAmountOver]}>
          {formatEuro(category.spent)} <Text style={styles.categoryCardLimit}>/ {formatEuro(category.monthly_limit)}</Text>
        </Text>
      </View>
      <ProgressBar progress={progress} color={overLimit ? colors.accent600 : category.color} />
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
    headerActions: {
      flexDirection: 'row',
      gap: spacing.xs,
    },
    content: {
      paddingHorizontal: spacing.lg,
      maxWidth: 640,
      width: '100%',
      alignSelf: 'center',
      gap: spacing.sm,
    },
    summaryCard: {
      backgroundColor: colors.surface,
      borderRadius: radii.card,
      padding: spacing.lg,
      marginBottom: spacing.sm,
    },
    summaryLabel: {
      fontSize: 12,
      color: colors.textMuted,
    },
    summaryAmount: {
      fontFamily: typography.fontFamily,
      fontWeight: '800',
      fontSize: 26,
      color: colors.textPrimary,
      marginTop: 2,
    },
    summaryLimit: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.textMuted,
    },
    summaryBarWrap: {
      marginTop: spacing.md,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: spacing.xxl,
      paddingHorizontal: spacing.lg,
    },
    emptyTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: spacing.xs,
      textAlign: 'center',
    },
    emptySubtitle: {
      fontSize: 13,
      color: colors.textMuted,
      textAlign: 'center',
    },
    emptyButton: {
      marginTop: spacing.lg,
      backgroundColor: colors.accent500,
      borderRadius: radii.card,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
    },
    emptyButtonPressed: {
      backgroundColor: colors.accent600,
    },
    emptyButtonText: {
      color: '#ffffff',
      fontSize: 14,
      fontWeight: '700',
    },
    categoryCard: {
      backgroundColor: colors.surface,
      borderRadius: radii.card,
      padding: spacing.lg,
      gap: spacing.sm,
    },
    categoryCardPressed: {
      backgroundColor: colors.surfaceHover,
    },
    categoryCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    categoryCardTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    colorDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    categoryCardTitle: {
      fontSize: typography.cardTitle.fontSize,
      fontWeight: typography.cardTitle.fontWeight,
      color: colors.textPrimary,
    },
    categoryCardAmount: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    categoryCardAmountOver: {
      color: colors.accent600,
    },
    categoryCardLimit: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textMuted,
    },
  });
}
