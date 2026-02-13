import { useMemo } from 'react';
import type { BetterFetchError } from '@better-fetch/fetch';
import { authClient, type ClientSession } from '@/lib/auth/client';
import type { Role } from '@/lib/auth';

export interface UseSessionResult {
  session: ClientSession | null;
  user: ClientSession['user'] | null;
  role: Role | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: BetterFetchError | null;
}

export const useSession = (): UseSessionResult => {
  const { data, isPending, error } = authClient.useSession();

  return useMemo<UseSessionResult>(() => {
    const session = (data ?? null) as ClientSession | null;
    const user: ClientSession['user'] | null = session?.user ?? null;
    const role: Role | null = (user?.role as Role) ?? null;

    return {
      session,
      user,
      role,
      isLoading: isPending,
      isAuthenticated: session !== null,
      error,
    };
  }, [data, isPending, error]);
};
