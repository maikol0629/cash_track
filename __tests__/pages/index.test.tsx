import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import HomePage from '@/pages/index';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';

jest.mock('@/components/layout/MainLayout', () => ({
  MainLayout: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/components/auth/RoleGuard', () => ({
  RoleGuard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/lib/hooks/useCurrentUser', () => ({
  useCurrentUser: jest.fn(),
}));

describe('HomePage', () => {
  it('shows admin navigation when the current user is an admin', () => {
    (useCurrentUser as jest.Mock).mockReturnValue({
      user: {
        id: 'user-1',
        email: 'admin@example.com',
        role: 'ADMIN',
      },
    });

    render(<HomePage />);

    expect(screen.getByText('Bienvenido a Cash Track')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Gestionar usuarios' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ver reportes' })).toBeInTheDocument();
  });

  it('shows the restricted admin buttons for regular users', () => {
    (useCurrentUser as jest.Mock).mockReturnValue({
      user: {
        id: 'user-1',
        email: 'user@example.com',
        role: 'USER',
      },
    });

    render(<HomePage />);

    expect(screen.getAllByRole('button', { name: 'Solo administradores' })).toHaveLength(2);
  });
});
