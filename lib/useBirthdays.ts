import { useCallback, useEffect, useState } from 'react';

import { useAuth } from './AuthProvider';
import { startOfDay } from './calendarUtils';
import { useFamily } from './FamilyProvider';
import { supabase } from './supabase';

/**
 * Sentinel year used to store a manual birthday whose real birth year is
 * unknown — `birthdays.birth_date` is a plain `date`, so it always has to
 * carry *some* year. 1904 is a leap year (so Feb 29 birthdays round-trip
 * fine) and far enough in the past that no real family member would be that
 * old, so it can't collide with a genuine birth year.
 */
export const UNKNOWN_BIRTH_YEAR = 1904;

export type BirthdaySource = 'member' | 'manual';

export type BirthdayEntry = {
  id: string;
  source: BirthdaySource;
  name: string;
  /** 'YYYY-MM-DD'; the year is the sentinel above when unknown. */
  birthDate: string;
  hasYear: boolean;
  daysUntil: number;
  turningAge: number | null;
};

export type BirthdayInput = {
  name: string;
  birthDate: string;
};

type MemberBirthdayRow = {
  user_id: string;
  name: string;
  birth_date: string;
};

type ManualBirthdayRow = {
  id: string;
  name: string;
  birth_date: string;
};

function daysUntilNextOccurrence(birthDate: string, today: Date): number {
  const [, month, day] = birthDate.split('-').map(Number);
  const todayStart = startOfDay(today);
  let next = new Date(todayStart.getFullYear(), month - 1, day);
  if (next.getTime() < todayStart.getTime()) {
    next = new Date(todayStart.getFullYear() + 1, month - 1, day);
  }
  return Math.round((next.getTime() - todayStart.getTime()) / (24 * 60 * 60 * 1000));
}

function turningAgeOf(birthDate: string, today: Date): number | null {
  const [year, month, day] = birthDate.split('-').map(Number);
  if (year === UNKNOWN_BIRTH_YEAR) return null;

  const todayStart = startOfDay(today);
  let nextYear = todayStart.getFullYear();
  const thisYearBirthday = new Date(nextYear, month - 1, day);
  if (thisYearBirthday.getTime() < todayStart.getTime()) nextYear += 1;
  return nextYear - year;
}

export function useBirthdays() {
  const { session } = useAuth();
  const { family } = useFamily();
  const userId = session?.user.id ?? null;

  const [entries, setEntries] = useState<BirthdayEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId || !family) {
      setEntries([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const [{ data: memberRows, error: memberError }, { data: manualRows, error: manualError }] = await Promise.all([
        supabase.rpc('get_family_member_birthdays', { target_family_id: family.id }),
        supabase.from('birthdays').select('id, name, birth_date').eq('family_id', family.id),
      ]);
      if (memberError) throw new Error(memberError.message);
      if (manualError) throw new Error(manualError.message);

      const today = new Date();
      const combined: BirthdayEntry[] = [
        ...((memberRows ?? []) as MemberBirthdayRow[]).map((row) => ({
          id: row.user_id,
          source: 'member' as const,
          name: row.name,
          birthDate: row.birth_date,
          hasYear: true,
          daysUntil: daysUntilNextOccurrence(row.birth_date, today),
          turningAge: turningAgeOf(row.birth_date, today),
        })),
        ...((manualRows ?? []) as ManualBirthdayRow[]).map((row) => ({
          id: row.id,
          source: 'manual' as const,
          name: row.name,
          birthDate: row.birth_date,
          hasYear: !row.birth_date.startsWith(`${UNKNOWN_BIRTH_YEAR}-`),
          daysUntil: daysUntilNextOccurrence(row.birth_date, today),
          turningAge: turningAgeOf(row.birth_date, today),
        })),
      ];
      combined.sort((a, b) => a.daysUntil - b.daysUntil);

      setEntries(combined);
    } catch (err) {
      console.error('[birthdays]', err);
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los cumpleaños.');
      setEntries([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId, family]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createBirthday = useCallback(
    async (input: BirthdayInput) => {
      if (!userId) throw new Error('not_authenticated');
      if (!family) throw new Error('no_family');
      const { error: insertError } = await supabase.from('birthdays').insert({
        family_id: family.id,
        created_by: userId,
        name: input.name,
        birth_date: input.birthDate,
      });
      if (insertError) throw new Error(insertError.message);
      await refresh();
    },
    [userId, family, refresh]
  );

  const updateBirthday = useCallback(
    async (id: string, input: BirthdayInput) => {
      const { error: updateError } = await supabase
        .from('birthdays')
        .update({ name: input.name, birth_date: input.birthDate })
        .eq('id', id);
      if (updateError) throw new Error(updateError.message);
      await refresh();
    },
    [refresh]
  );

  const deleteBirthday = useCallback(
    async (id: string) => {
      const { error: deleteError } = await supabase.from('birthdays').delete().eq('id', id);
      if (deleteError) throw new Error(deleteError.message);
      await refresh();
    },
    [refresh]
  );

  return { entries, isLoading, error, refresh, createBirthday, updateBirthday, deleteBirthday };
}
