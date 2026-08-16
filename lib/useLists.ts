import { useCallback, useEffect, useState } from 'react';

import { useAuth } from './AuthProvider';
import { useFamily } from './FamilyProvider';
import { supabase } from './supabase';

export type ListCategory = 'compra' | 'tareas' | 'otros';
export type ListVisibility = 'privada' | 'compartida';

export type ListSummary = {
  id: string;
  family_id: string;
  created_by: string;
  name: string;
  category: ListCategory;
  visibility: ListVisibility;
  created_at: string;
  pendingCount: number;
  totalCount: number;
};

export type NewListInput = {
  name: string;
  category: ListCategory;
  visibility: ListVisibility;
};

type ListRow = {
  id: string;
  family_id: string;
  created_by: string;
  name: string;
  category: ListCategory;
  visibility: ListVisibility;
  created_at: string;
};

type ItemCountRow = {
  list_id: string;
  is_done: boolean;
};

export function useLists() {
  const { session } = useAuth();
  const { family } = useFamily();
  const userId = session?.user.id ?? null;

  const [lists, setLists] = useState<ListSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) {
      setLists([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const { data: listRows, error: listsError } = await supabase
        .from('lists')
        .select('id, family_id, created_by, name, category, visibility, created_at')
        .order('created_at', { ascending: false });
      if (listsError) throw new Error(listsError.message);

      const { data: itemRows, error: itemsError } = await supabase
        .from('list_items')
        .select('list_id, is_done');
      if (itemsError) throw new Error(itemsError.message);

      const items = (itemRows ?? []) as ItemCountRow[];
      const summaries = ((listRows ?? []) as ListRow[]).map((list) => {
        const listItems = items.filter((item) => item.list_id === list.id);
        return {
          ...list,
          totalCount: listItems.length,
          pendingCount: listItems.filter((item) => !item.is_done).length,
        };
      });

      setLists(summaries);
    } catch (err) {
      console.error('[lists]', err);
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las listas.');
      setLists([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createList = useCallback(
    async (input: NewListInput) => {
      if (!userId) throw new Error('not_authenticated');
      if (!family) throw new Error('no_family');

      const { error: insertError } = await supabase.from('lists').insert({
        family_id: family.id,
        created_by: userId,
        name: input.name,
        category: input.category,
        visibility: input.visibility,
      });
      if (insertError) throw new Error(insertError.message);
      await refresh();
    },
    [userId, family, refresh]
  );

  return { lists, isLoading, error, refresh, createList };
}
