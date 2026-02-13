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
  // Reutiliza el hook de sesión actual para decidir qué mostrar en el cliente
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

  // Si no hay usuario autenticado se bloquea el acceso al contenido protegido
  if (!user) {
    return (
      fallback ?? (
        <p className='text-center text-red-500'>
          Debes iniciar sesión para acceder a esta página.
        </p>
      )
    );
  }

  // Si el usuario no tiene uno de los roles permitidos también se bloquea
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
