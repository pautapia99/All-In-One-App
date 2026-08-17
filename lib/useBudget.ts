import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAuth } from './AuthProvider';
import { useFamily } from './FamilyProvider';
import { supabase } from './supabase';

export type ExpenseVisibility = 'privado' | 'compartido';

export type BudgetCategory = {
  id: string;
  family_id: string;
  name: string;
  monthly_limit: number;
  color: string;
  created_at: string;
};

export type CategorySummary = BudgetCategory & {
  spent: number;
};

export type Expense = {
  id: string;
  family_id: string;
  created_by: string;
  category_id: string;
  concept: string;
  amount: number;
  expense_date: string;
  visibility: ExpenseVisibility;
  created_at: string;
};

export type CategoryInput = {
  name: string;
  monthlyLimit: number;
  color: string;
};

export type ExpenseInput = {
  categoryId: string;
  concept: string;
  amount: number;
  expenseDate: string;
  visibility: ExpenseVisibility;
};

type CategoryRow = {
  id: string;
  family_id: string;
  name: string;
  monthly_limit: number | string;
  color: string;
  created_at: string;
};

type ExpenseRow = {
  id: string;
  family_id: string;
  created_by: string;
  category_id: string;
  concept: string;
  amount: number | string;
  expense_date: string;
  visibility: ExpenseVisibility;
  created_at: string;
};

export function useBudget() {
  const { session } = useAuth();
  const { family } = useFamily();
  const userId = session?.user.id ?? null;

  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId || !family) {
      setCategories([]);
      setExpenses([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const [{ data: categoryRows, error: categoryError }, { data: expenseRows, error: expenseError }] =
        await Promise.all([
          supabase
            .from('budget_categories')
            .select('id, family_id, name, monthly_limit, color, created_at')
            .order('created_at', { ascending: true }),
          supabase
            .from('expenses')
            .select('id, family_id, created_by, category_id, concept, amount, expense_date, visibility, created_at')
            .order('expense_date', { ascending: false }),
        ]);
      if (categoryError) throw new Error(categoryError.message);
      if (expenseError) throw new Error(expenseError.message);

      // `numeric` columns can come back from PostgREST as strings (to avoid
      // float precision loss), so coerce explicitly — otherwise summing them
      // with `+` would silently concatenate instead of add.
      setCategories(
        ((categoryRows ?? []) as CategoryRow[]).map((row) => ({
          ...row,
          monthly_limit: Number(row.monthly_limit),
        }))
      );
      setExpenses(
        ((expenseRows ?? []) as ExpenseRow[]).map((row) => ({
          ...row,
          amount: Number(row.amount),
        }))
      );
    } catch (err) {
      console.error('[budget]', err);
      setError(err instanceof Error ? err.message : 'No se pudo cargar el presupuesto.');
      setCategories([]);
      setExpenses([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId, family]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const thisMonthExpenses = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    return expenses.filter((expense) => {
      const d = new Date(expense.expense_date);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  }, [expenses]);

  const categorySummaries: CategorySummary[] = useMemo(
    () =>
      categories.map((category) => ({
        ...category,
        spent: thisMonthExpenses
          .filter((expense) => expense.category_id === category.id)
          .reduce((sum, expense) => sum + expense.amount, 0),
      })),
    [categories, thisMonthExpenses]
  );

  const totalSpent = useMemo(
    () => thisMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0),
    [thisMonthExpenses]
  );
  const totalLimit = useMemo(() => categories.reduce((sum, category) => sum + category.monthly_limit, 0), [categories]);

  const createCategory = useCallback(
    async (input: CategoryInput) => {
      if (!family) throw new Error('no_family');
      const { error: insertError } = await supabase.from('budget_categories').insert({
        family_id: family.id,
        name: input.name,
        monthly_limit: input.monthlyLimit,
        color: input.color,
      });
      if (insertError) throw new Error(insertError.message);
      await refresh();
    },
    [family, refresh]
  );

  const updateCategory = useCallback(
    async (id: string, input: CategoryInput) => {
      const { error: updateError } = await supabase
        .from('budget_categories')
        .update({ name: input.name, monthly_limit: input.monthlyLimit, color: input.color })
        .eq('id', id);
      if (updateError) throw new Error(updateError.message);
      await refresh();
    },
    [refresh]
  );

  const deleteCategory = useCallback(
    async (id: string) => {
      const { error: deleteError } = await supabase.from('budget_categories').delete().eq('id', id);
      if (deleteError) throw new Error(deleteError.message);
      await refresh();
    },
    [refresh]
  );

  const createExpense = useCallback(
    async (input: ExpenseInput) => {
      if (!userId) throw new Error('not_authenticated');
      if (!family) throw new Error('no_family');
      const { error: insertError } = await supabase.from('expenses').insert({
        family_id: family.id,
        created_by: userId,
        category_id: input.categoryId,
        concept: input.concept,
        amount: input.amount,
        expense_date: input.expenseDate,
        visibility: input.visibility,
      });
      if (insertError) throw new Error(insertError.message);
      await refresh();
    },
    [userId, family, refresh]
  );

  const updateExpense = useCallback(
    async (id: string, input: ExpenseInput) => {
      const { error: updateError } = await supabase
        .from('expenses')
        .update({
          category_id: input.categoryId,
          concept: input.concept,
          amount: input.amount,
          expense_date: input.expenseDate,
          visibility: input.visibility,
        })
        .eq('id', id);
      if (updateError) throw new Error(updateError.message);
      await refresh();
    },
    [refresh]
  );

  const deleteExpense = useCallback(
    async (id: string) => {
      const { error: deleteError } = await supabase.from('expenses').delete().eq('id', id);
      if (deleteError) throw new Error(deleteError.message);
      await refresh();
    },
    [refresh]
  );

  return {
    categories,
    expenses,
    categorySummaries,
    totalSpent,
    totalLimit,
    isLoading,
    error,
    refresh,
    createCategory,
    updateCategory,
    deleteCategory,
    createExpense,
    updateExpense,
    deleteExpense,
  };
}
