import type { ReactNode } from 'react';
import type { Role } from '@/lib/auth';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles?: Role[];
  fallback?: ReactNode;
}

export const RoleGuard = ({
  children,
  allowedRoles,
  fallback,
}: RoleGuardProps) => {
  const { user, isLoading, error } = useCurrentUser();

  if (isLoading) {
    return null;
  }

  if (error) {
    return (
      fallback ?? (
        <p className='text-center text-red-500'>
          Ocurrió un error al verificar tus permisos.
        </p>
      )
    );
  }

  if (!user) {
    return (
      fallback ?? (
        <p className='text-center text-red-500'>
          Debes iniciar sesión para acceder a esta página.
        </p>
      )
    );
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      fallback ?? (
        <p className='text-center text-red-500'>
          403 - No tienes permisos para acceder a esta página.
        </p>
      )
    );
  }

  return <>{children}</>;
};
