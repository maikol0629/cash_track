import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useRouter } from 'next/router';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/lib/hooks/useCurrentUser', () => ({
  useCurrentUser: jest.fn(),
}));

describe('RoleGuard', () => {
  const replace = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ replace });
  });

  it('returns nothing while loading', () => {
    (useCurrentUser as jest.Mock).mockReturnValue({
      user: null,
      isLoading: true,
      error: null,
    });

    const { container } = render(
      <RoleGuard>
        <div>Protected</div>
      </RoleGuard>
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('redirects to login when there is no user and no fallback', async () => {
    (useCurrentUser as jest.Mock).mockReturnValue({
      user: null,
      isLoading: false,
      error: null,
    });

    render(
      <RoleGuard>
        <div>Protected</div>
      </RoleGuard>
    );

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/login'));
  });

  it('renders the fallback when the user has an invalid role', () => {
    (useCurrentUser as jest.Mock).mockReturnValue({
      user: { id: 'user-1', role: 'USER' },
      isLoading: false,
      error: null,
    });

    render(
      <RoleGuard allowedRoles={['ADMIN']} fallback={<div>Denied</div>}>
        <div>Protected</div>
      </RoleGuard>
    );

    expect(screen.getByText('Denied')).toBeInTheDocument();
  });

  it('renders children when the role is allowed', () => {
    (useCurrentUser as jest.Mock).mockReturnValue({
      user: { id: 'user-1', role: 'ADMIN' },
      isLoading: false,
      error: null,
    });

    render(
      <RoleGuard allowedRoles={['ADMIN']}>
        <div>Protected</div>
      </RoleGuard>
    );

    expect(screen.getByText('Protected')).toBeInTheDocument();
  });
});
