import { useRouter } from 'next/router';
import { useState } from 'react';
import { authClient } from '@/lib/auth/client';
import { Button } from '@/components/ui/button';
import { useSession } from '@/lib/hooks/useSession';

const LoginPage = () => {
  const router = useRouter();
  const { session, isLoading } = useSession();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleSignIn = async () => {
    try {
      setIsSigningIn(true);
      const { data, error } = await authClient.signIn.social({
        provider: 'github',
        callbackURL: '/movements',
      });

      if (error) {
        // eslint-disable-next-line no-console
        console.error('GitHub sign-in failed', error);
        return;
      }

      if (data?.url) {
        globalThis.location.href = data.url;
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('GitHub sign-in failed', error);
    } finally {
      setIsSigningIn(false);
    }
  };

  if (!isLoading && session) {
    void router.replace('/movements');
    return null;
  }

  return (
    <main className='flex min-h-screen flex-col items-center justify-center gap-6'>
      <h1 className='text-3xl font-bold'>Iniciar sesión</h1>
      <p className='text-sm text-muted-foreground'>
        Usa tu cuenta de GitHub para acceder a la aplicación.
      </p>
      <Button onClick={handleSignIn} disabled={isSigningIn || isLoading}>
        {isSigningIn || isLoading
          ? 'Conectando con GitHub…'
          : 'Continuar con GitHub'}
      </Button>
    </main>
  );
};

export default LoginPage;
