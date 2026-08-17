import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ExpenseFormSheet, type ExpenseFormValues } from '../../../components/ExpenseFormSheet';
import { ProgressBar } from '../../../components/ProgressBar';
import { ChevronLeftIcon, LockIcon, PlusIcon, UsersIcon } from '../../../components/icons';
import { useAuth } from '../../../lib/AuthProvider';
import { formatEuro } from '../../../lib/budgetUtils';
import { useFamily } from '../../../lib/FamilyProvider';
import { useColors } from '../../../lib/ThemeProvider';
import { radii, spacing, typography, type ColorPalette } from '../../../lib/theme';
import { useBudget, type Expense, type ExpenseInput } from '../../../lib/useBudget';

export default function CategoryDetailScreen() {
  const { categoryId } = useLocalSearchParams<{ categoryId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { session } = useAuth();
  const { members } = useFamily();
  const { categories, categorySummaries, expenses, refresh, createExpense, updateExpense, deleteExpense } =
    useBudget();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const category = categories.find((c) => c.id === categoryId) ?? null;
  const summary = categorySummaries.find((c) => c.id === categoryId) ?? null;

  const monthExpenses = useMemo(() => {
    const now = new Date();
    return expenses
      .filter((expense) => expense.category_id === categoryId)
      .filter((expense) => {
        const d = new Date(expense.expense_date);
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      })
      .sort((a, b) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime());
  }, [expenses, categoryId]);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  function openCreateSheet() {
    setEditingExpense(null);
    setSheetOpen(true);
  }

  function openEditSheet(expense: Expense) {
    setEditingExpense(expense);
    setSheetOpen(true);
  }

  async function handleSubmit(values: ExpenseInput) {
    if (editingExpense) {
      await updateExpense(editingExpense.id, values);
    } else {
      await createExpense(values);
    }
  }

  async function handleDelete() {
    if (!editingExpense) return;
    await deleteExpense(editingExpense.id);
  }

  function memberName(userId: string): string {
    if (userId === session?.user.id) return 'Tú';
    const member = members.find((m) => m.user_id === userId);
    return member?.alias || member?.email || 'Miembro';
  }

  if (!category) return null;

  const initialFormValues: ExpenseFormValues = editingExpense
    ? {
        concept: editingExpense.concept,
        amount: String(editingExpense.amount),
        dateIso: editingExpense.expense_date,
        categoryId: editingExpense.category_id,
        visibility: editingExpense.visibility,
      }
    : { concept: '', amount: '', dateIso: null, categoryId: category.id, visibility: 'compartido' };

  const spent = summary?.spent ?? 0;
  const overLimit = category.monthly_limit > 0 && spent > category.monthly_limit;

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.headerButton}>
          <ChevronLeftIcon size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {category.name}
        </Text>
        <Pressable onPress={openCreateSheet} hitSlop={8} style={styles.headerButton}>
          <PlusIcon size={22} color={colors.textPrimary} />
        </Pressable>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryTitleRow}>
          <View style={[styles.colorDot, { backgroundColor: category.color }]} />
          <Text style={styles.summaryAmount}>
            {formatEuro(spent)}
            <Text style={styles.summaryLimit}> / {formatEuro(category.monthly_limit)}</Text>
          </Text>
        </View>
        <View style={styles.summaryBarWrap}>
          <ProgressBar
            progress={category.monthly_limit > 0 ? spent / category.monthly_limit : 0}
            color={overLimit ? colors.accent600 : category.color}
            height={10}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}>
        {monthExpenses.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Sin gastos este mes</Text>
            <Text style={styles.emptySubtitle}>Toca el + de arriba para añadir el primero.</Text>
          </View>
        )}

        {monthExpenses.map((expense) => {
          const VisibilityIcon = expense.visibility === 'privado' ? LockIcon : UsersIcon;
          return (
            <Pressable
              key={expense.id}
              onPress={() => openEditSheet(expense)}
              style={({ pressed }) => [styles.expenseRow, pressed && styles.expenseRowPressed]}
            >
              <View style={styles.expenseBody}>
                <Text style={styles.expenseConcept}>{expense.concept}</Text>
                <View style={styles.expenseMetaRow}>
                  <Text style={styles.expenseMeta}>
                    {new Date(expense.expense_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                  </Text>
                  <View style={styles.expenseMetaDivider} />
                  <Text style={styles.expenseMeta}>{memberName(expense.created_by)}</Text>
                  <View style={styles.expenseMetaDivider} />
                  <VisibilityIcon size={11} color={colors.textMuted} strokeWidth={2} />
                </View>
              </View>
              <Text style={styles.expenseAmount}>{formatEuro(expense.amount)}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ExpenseFormSheet
        visible={sheetOpen}
        categories={categories}
        initialValues={initialFormValues}
        onClose={() => setSheetOpen(false)}
        onSubmit={handleSubmit}
        onDelete={editingExpense ? handleDelete : undefined}
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
    summaryCard: {
      backgroundColor: colors.surface,
      borderRadius: radii.card,
      padding: spacing.lg,
      marginHorizontal: spacing.lg,
      marginBottom: spacing.sm,
    },
    summaryTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    colorDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    summaryAmount: {
      fontFamily: typography.fontFamily,
      fontWeight: '800',
      fontSize: 22,
      color: colors.textPrimary,
    },
    summaryLimit: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textMuted,
    },
    summaryBarWrap: {
      marginTop: spacing.md,
    },
    content: {
      paddingHorizontal: spacing.lg,
      maxWidth: 640,
      width: '100%',
      alignSelf: 'center',
      gap: spacing.xs,
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
    expenseRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      borderRadius: radii.card,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      marginBottom: spacing.xs,
    },
    expenseRowPressed: {
      backgroundColor: colors.surfaceHover,
    },
    expenseBody: {
      flex: 1,
    },
    expenseConcept: {
      fontSize: 14.5,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    expenseMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 2,
    },
    expenseMeta: {
      fontSize: 12,
      color: colors.textMuted,
    },
    expenseMetaDivider: {
      width: 3,
      height: 3,
      borderRadius: 1.5,
      backgroundColor: colors.textMuted,
    },
    expenseAmount: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
      marginLeft: spacing.sm,
    },
  });
}
