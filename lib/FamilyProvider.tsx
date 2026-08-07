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

export type Family = {
  id: string;
  name: string;
  invite_code: string;
  created_by: string;
  created_at: string;
};

export type FamilyMember = {
  user_id: string;
  email: string | null;
  joined_at: string;
};

type FamilyMembershipRow = {
  family_id: string;
  families: Family | Family[] | null;
};

type FamilyContextValue = {
  family: Family | null;
  members: FamilyMember[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createFamily: (name: string) => Promise<void>;
  joinFamily: (code: string) => Promise<void>;
};

const FamilyContext = createContext<FamilyContextValue>({
  family: null,
  members: [],
  isLoading: true,
  error: null,
  refresh: async () => {},
  createFamily: async () => {},
  joinFamily: async () => {},
});

export function useFamily() {
  return useContext(FamilyContext);
}

// La API de Supabase devuelve la relación embebida "families" como objeto
// cuando es un to-one, pero como array en algunos clientes/versiones — este
// helper normaliza ambos casos.
function normalizeFamily(value: Family | Family[] | null): Family | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export function FamilyProvider({ children }: PropsWithChildren) {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;

  const [family, setFamily] = useState<Family | null>(null);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) {
      setFamily(null);
      setMembers([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const { data, error: membershipError } = await supabase
        .from('family_members')
        .select('family_id, families(id, name, invite_code, created_by, created_at)')
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle<FamilyMembershipRow>();

      if (membershipError) throw new Error(membershipError.message);

      const currentFamily = normalizeFamily(data?.families ?? null);
      setFamily(currentFamily);

      if (currentFamily) {
        const { data: memberRows, error: membersError } = await supabase.rpc(
          'get_family_members',
          { target_family_id: currentFamily.id }
        );
        if (membersError) throw new Error(membersError.message);
        setMembers((memberRows ?? []) as FamilyMember[]);
      } else {
        setMembers([]);
      }
    } catch (err) {
      console.error('[family]', err);
      setError(err instanceof Error ? err.message : 'No se pudo cargar la familia.');
      setFamily(null);
      setMembers([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createFamily = useCallback(
    async (name: string) => {
      const { error: rpcError } = await supabase.rpc('create_family', { family_name: name });
      // supabase-js returns PostgREST/RPC errors as plain objects, not Error
      // instances, so we normalize here — callers can rely on `instanceof Error`.
      if (rpcError) throw new Error(rpcError.message);
      await refresh();
    },
    [refresh]
  );

  const joinFamily = useCallback(
    async (code: string) => {
      const { error: rpcError } = await supabase.rpc('join_family_by_code', { code });
      if (rpcError) throw new Error(rpcError.message);
      await refresh();
    },
    [refresh]
  );

  return (
    <FamilyContext.Provider
      value={{ family, members, isLoading, error, refresh, createFamily, joinFamily }}
    >
      {children}
    </FamilyContext.Provider>
  );
}
