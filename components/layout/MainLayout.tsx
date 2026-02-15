import Link from 'next/link';
import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { authClient } from '@/lib/auth/client';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  const router = useRouter();
  const { user, isLoading } = useCurrentUser();
  const isAdmin = user?.role === 'ADMIN';

  const handleLogout = async () => {
    await authClient.signOut();
    router.push('/login');
  };

  return (
    <div className='min-h-screen bg-background text-foreground'>
      <header className='border-b bg-card'>
        <div className='mx-auto flex max-w-5xl items-center justify-between px-4 py-3'>
          <div className='flex items-center gap-4'>
            <span className='text-lg font-semibold'>Cash Track</span>
            {!isLoading && user && (
              <span className='text-xs text-muted-foreground'>
                {user.email} · Rol: {user.role}
              </span>
            )}
          </div>
          <nav className='flex items-center gap-2 text-sm'>
            {!isLoading && user ? (
              <>
                <Link href='/'>
                  <Button variant='ghost' className='px-3 py-1 text-sm'>
                    Inicio
                  </Button>
                </Link>
                <Link href='/movements'>
                  <Button variant='ghost' className='px-3 py-1 text-sm'>
                    Movimientos
                  </Button>
                </Link>

                {isAdmin && (
                  <>
                    <Link href='/users'>
                      <Button variant='ghost' className='px-3 py-1 text-sm'>
                        Usuarios
                      </Button>
                    </Link>
                    <Link href='/reports'>
                      <Button variant='ghost' className='px-3 py-1 text-sm'>
                        Reportes
                      </Button>
                    </Link>
                  </>
                )}
                <Button
                  variant='outline'
                  size='sm'
                  className='ml-4'
                  onClick={handleLogout}
                >
                  Cerrar sesión
                </Button>
              </>
            ) : (
              <Button
                variant='outline'
                size='sm'
                className='ml-4'
                onClick={() => router.push('/login')}
              >
                Iniciar sesión
              </Button>
            )}
          </nav>
        </div>
      </header>
      <main className='mx-auto max-w-5xl px-4 py-6'>{children}</main>
    </div>
  );
};
