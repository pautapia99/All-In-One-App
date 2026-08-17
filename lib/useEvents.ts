import { useCallback, useEffect, useState } from 'react';

import { useAuth } from './AuthProvider';
import { useFamily } from './FamilyProvider';
import { supabase } from './supabase';

export type EventVisibility = 'privado' | 'compartido';

export type CalendarEvent = {
  id: string;
  family_id: string;
  created_by: string;
  title: string;
  start_at: string;
  end_at: string;
  is_all_day: boolean;
  visibility: EventVisibility;
  created_at: string;
};

export type EventInput = {
  title: string;
  start_at: string;
  end_at: string;
  is_all_day: boolean;
  visibility: EventVisibility;
};

export function useEvents() {
  const { session } = useAuth();
  const { family } = useFamily();
  const userId = session?.user.id ?? null;

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) {
      setEvents([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('events')
        .select('id, family_id, created_by, title, start_at, end_at, is_all_day, visibility, created_at')
        .order('start_at', { ascending: true });
      if (fetchError) throw new Error(fetchError.message);
      setEvents((data ?? []) as CalendarEvent[]);
    } catch (err) {
      console.error('[events]', err);
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los eventos.');
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createEvent = useCallback(
    async (input: EventInput) => {
      if (!userId) throw new Error('not_authenticated');
      if (!family) throw new Error('no_family');
      const { error: insertError } = await supabase.from('events').insert({
        family_id: family.id,
        created_by: userId,
        title: input.title,
        start_at: input.start_at,
        end_at: input.end_at,
        is_all_day: input.is_all_day,
        visibility: input.visibility,
      });
      if (insertError) throw new Error(insertError.message);
      await refresh();
    },
    [userId, family, refresh]
  );

  const updateEvent = useCallback(
    async (id: string, input: EventInput) => {
      const { error: updateError } = await supabase
        .from('events')
        .update({
          title: input.title,
          start_at: input.start_at,
          end_at: input.end_at,
          is_all_day: input.is_all_day,
          visibility: input.visibility,
        })
        .eq('id', id);
      if (updateError) throw new Error(updateError.message);
      await refresh();
    },
    [refresh]
  );

  const deleteEvent = useCallback(
    async (id: string) => {
      const { error: deleteError } = await supabase.from('events').delete().eq('id', id);
      if (deleteError) throw new Error(deleteError.message);
      await refresh();
    },
    [refresh]
  );

  return { events, isLoading, error, refresh, createEvent, updateEvent, deleteEvent };
}
