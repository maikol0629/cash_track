import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/router';
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
  const router = useRouter();

  // Redirección automática a /login cuando no hay usuario y no se
  // proporcionó un fallback explícito. De esta forma evitamos duplicar
  // lógica de redirección en cada página.
  useEffect(() => {
    if (!isLoading && !error && !user && !fallback) {
      void router.replace('/login');
    }
  }, [isLoading, error, user, fallback, router]);

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
      // Si se pasa un fallback, se respeta; si no, el efecto anterior
      // ya habrá disparado la redirección a /login y aquí no
      // renderizamos nada adicional.
      fallback ?? null
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
