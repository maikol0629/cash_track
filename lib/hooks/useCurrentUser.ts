import type { CurrentUser } from '@/lib/context/CurrentUserContext';
import { useCurrentUserContext } from '@/lib/context/CurrentUserContext';

interface UseCurrentUserResult {
  user: CurrentUser | null;
  isLoading: boolean;
  error: string | null;
}

export const useCurrentUser = (): UseCurrentUserResult => {
  const { user, isLoading, error } = useCurrentUserContext();

  return { user, isLoading, error };
};
