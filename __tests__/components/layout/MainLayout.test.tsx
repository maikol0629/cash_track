import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { useRouter } from 'next/router';
import { authClient } from '@/lib/auth/client';

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/lib/hooks/useCurrentUser', () => ({
  useCurrentUser: jest.fn(),
}));

jest.mock('@/lib/auth/client', () => ({
  authClient: {
    signOut: jest.fn(),
  },
}));

describe('MainLayout', () => {
  const push = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push });
  });

  it('shows the login button when there is no session', () => {
    (useCurrentUser as jest.Mock).mockReturnValue({
      user: null,
      isLoading: false,
    });

    render(
      <MainLayout>
        <div>Content</div>
      </MainLayout>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    expect(push).toHaveBeenCalledWith('/login');
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('renders admin navigation and signs out correctly', async () => {
    (useCurrentUser as jest.Mock).mockReturnValue({
      user: {
        id: 'user-1',
        email: 'admin@example.com',
        role: 'ADMIN',
      },
      isLoading: false,
    });
    (authClient.signOut as jest.Mock).mockResolvedValue(undefined);

    render(
      <MainLayout>
        <div>Content</div>
      </MainLayout>
    );

    expect(screen.getByText('admin@example.com · Rol: ADMIN')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Usuarios' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reportes' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));

    expect(authClient.signOut).toHaveBeenCalledTimes(1);

    await waitFor(() => expect(push).toHaveBeenCalledWith('/login'));
  });
});
