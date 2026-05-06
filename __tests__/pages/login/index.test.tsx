import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoginPage from '@/pages/login';
import { useSession } from '@/lib/hooks/useSession';
import { useRouter } from 'next/router';
import { authClient } from '@/lib/auth/client';

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/lib/hooks/useSession', () => ({
  useSession: jest.fn(),
}));

jest.mock('@/lib/auth/client', () => ({
  authClient: {
    signIn: {
      social: jest.fn(),
    },
  },
}));

describe('LoginPage', () => {
  const replace = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ replace });
  });

  it('redirects authenticated users to movements', async () => {
    (useSession as jest.Mock).mockReturnValue({
      session: { user: { id: 'user-1' } },
      isLoading: false,
    });

    render(<LoginPage />);

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/movements'));
  });

  it('starts the GitHub sign-in flow for anonymous users', async () => {
    (useSession as jest.Mock).mockReturnValue({
      session: null,
      isLoading: false,
    });
    (authClient.signIn.social as jest.Mock).mockResolvedValue({
      data: {},
      error: null,
    });

    render(<LoginPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Continuar con GitHub' }));

    await waitFor(() =>
      expect(authClient.signIn.social).toHaveBeenCalledWith({
        provider: 'github',
        callbackURL: '/movements',
      })
    );
  });
});
