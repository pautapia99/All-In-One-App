import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react';

import { useAuth } from './AuthProvider';
import { supabase } from './supabase';

export type Profile = {
  id: string;
  first_name: string;
  last_name: string;
  birth_date: string; // 'YYYY-MM-DD'
  alias: string;
  created_at: string;
};

export type ProfileInput = {
  first_name: string;
  last_name: string;
  birth_date: string; // 'YYYY-MM-DD'
  alias: string;
};

type ProfileContextValue = {
  profile: Profile | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  saveProfile: (input: ProfileInput) => Promise<void>;
};

const ProfileContext = createContext<ProfileContextValue>({
  profile: null,
  isLoading: true,
  error: null,
  refresh: async () => {},
  saveProfile: async () => {},
});

export function useProfile() {
  return useContext(ProfileContext);
}

export function ProfileProvider({ children }: PropsWithChildren) {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, birth_date, alias, created_at')
        .eq('id', userId)
        .maybeSingle<Profile>();

      if (fetchError) throw new Error(fetchError.message);
      setProfile(data ?? null);
    } catch (err) {
      console.error('[profile]', err);
      setError(err instanceof Error ? err.message : 'No se pudo cargar el perfil.');
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const saveProfile = useCallback(
    async (input: ProfileInput) => {
      if (!userId) throw new Error('not_authenticated');

      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({ id: userId, ...input });

      if (upsertError) throw new Error(upsertError.message);
      await refresh();
    },
    [userId, refresh]
  );

  return (
    <ProfileContext.Provider value={{ profile, isLoading, error, refresh, saveProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}
