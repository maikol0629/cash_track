import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Role } from '@/lib/auth';

export interface CurrentUser {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: Role;
  image: string | null;
}

interface CurrentUserContextValue {
  user: CurrentUser | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const CurrentUserContext = createContext<CurrentUserContextValue | undefined>(
  undefined
);

interface CurrentUserProviderProps {
  children: ReactNode;
}

export const CurrentUserProvider = ({ children }: CurrentUserProviderProps) => {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ useCallback: la función loadUser mantiene la misma referencia entre renders
  const loadUser = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/me');

      if (!res.ok) {
        if (res.status === 401) {
          setUser(null);
          return;
        }

        throw new Error(`Request failed with status ${res.status}`);
      }

      const data = (await res.json()) as CurrentUser;
      setUser(data);
    } catch (err) {
      setError((err as Error).message);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []); // ← Sin dependencias porque solo usa setters (que son estables)

  useEffect(() => {
    void loadUser();
  }, [loadUser]); // ← Ahora loadUser es una dependencia estable

  // useMemo: el objeto value solo se recrea cuando cambian sus dependencias
  const value: CurrentUserContextValue = useMemo(
    () => ({
      user,
      isLoading,
      error,
      refetch: loadUser,
    }),
    [user, isLoading, error, loadUser] // ← Solo se recrea si estos cambian
  );

  return (
    <CurrentUserContext.Provider value={value}>
      {children}
    </CurrentUserContext.Provider>
  );
};

export const useCurrentUserContext = (): CurrentUserContextValue => {
  const ctx = useContext(CurrentUserContext);

  if (!ctx) {
    throw new Error(
      'useCurrentUserContext must be used within a CurrentUserProvider'
    );
  }

  return ctx;
};
