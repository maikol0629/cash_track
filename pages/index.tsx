import Link from 'next/link';
import { authClient } from '@/lib/auth/client';
import { useSession } from '@/lib/hooks/useSession';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { Button } from '@/components/ui/button';

const Home = () => {
  const { session, isLoading: isSessionLoading } = useSession();
  const { user, isLoading: isUserLoading } = useCurrentUser();

  const isLoading = isSessionLoading || isUserLoading;

  const handleSignIn = async () => {
    try {
      const { data, error } = await authClient.signIn.social({
        provider: 'github',
        // a dónde volver después del login
        callbackURL: '/',
      });

      if (error) {
        // eslint-disable-next-line no-console
        console.error('GitHub sign-in failed', error);
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('GitHub sign-in failed', error);
    }
  };

  const handleSignOut = async () => {
    await authClient.signOut();
    window.location.reload();
  };

  const isAdmin = user?.role === 'ADMIN';

  return (
    <main className='min-h-screen flex flex-col items-center justify-center gap-6'>
      <h1 className='text-3xl font-bold'>Cash Track</h1>

      {isLoading && <p>Cargando sesión...</p>}

      {!session && !isLoading && (
        <Button
          type='button'
          onClick={handleSignIn}
          className='px-4 py-2 rounded bg-black text-white hover:bg-zinc-800'
        >
          Iniciar sesión con GitHub
        </Button>
      )}

      {session && user && (
        <div className='flex flex-col items-center gap-4'>
          <div className='text-center'>
            <p className='font-medium'>Hola, {user.name ?? user.email}</p>
            <p className='text-sm text-zinc-500'>Rol: {user.role}</p>
          </div>

          <nav className='flex flex-col items-center gap-2'>
            <Link
              href='/movements'
              className='text-blue-600 hover:underline'
            >
              Sistema de ingresos y egresos
            </Link>
            {isAdmin && (
              <>
                <Link href='/users' className='text-blue-600 hover:underline'>
                  Gestión de usuarios
                </Link>
                <Link href='/reports' className='text-blue-600 hover:underline'>
                  Reportes
                </Link>
              </>
            )}
          </nav>

          <button
            type='button'
            onClick={handleSignOut}
            className='px-3 py-1 rounded border border-zinc-300 hover:bg-zinc-50'
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </main>
  );
};

export default Home;
