import { renderHook } from '@testing-library/react';
import { useSession } from '@/lib/hooks/useSession';
import { authClient } from '@/lib/auth/client';

jest.mock('@/lib/auth/client', () => ({
  authClient: {
    useSession: jest.fn(),
  },
}));

describe('useSession', () => {
  it('maps the session data into the expected shape', () => {
    (authClient.useSession as jest.Mock).mockReturnValue({
      data: {
        user: {
          id: 'user-1',
          name: 'Jane',
          email: 'jane@example.com',
          role: 'ADMIN',
        },
      },
      isPending: false,
      error: null,
    });

    const { result } = renderHook(() => useSession());

    expect(result.current.session).not.toBeNull();
    expect(result.current.user?.email).toBe('jane@example.com');
    expect(result.current.role).toBe('ADMIN');
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  it('returns a null session and pending state when no data is available', () => {
    (authClient.useSession as jest.Mock).mockReturnValue({
      data: null,
      isPending: true,
      error: null,
    });

    const { result } = renderHook(() => useSession());

    expect(result.current.session).toBeNull();
    expect(result.current.user).toBeNull();
    expect(result.current.role).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(true);
  });
});
