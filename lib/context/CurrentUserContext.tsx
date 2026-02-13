import {
  createContext,
  useContext,
  useEffect,
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

export const CurrentUserProvider = ({
  children,
}: CurrentUserProviderProps) => {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadUser = async () => {
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
  };

  useEffect(() => {
    void loadUser();
  }, []);

  const value: CurrentUserContextValue = {
    user,
    isLoading,
    error,
    refetch: loadUser,
  };

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
