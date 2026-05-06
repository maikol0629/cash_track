import { renderHook } from '@testing-library/react';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { useCurrentUserContext } from '@/lib/context/CurrentUserContext';

jest.mock('@/lib/context/CurrentUserContext', () => ({
  useCurrentUserContext: jest.fn(),
}));

describe('useCurrentUser', () => {
  it('returns the current user context as-is', () => {
    const contextValue = {
      user: {
        id: 'user-1',
        name: 'Jane',
        email: 'jane@example.com',
        phone: null,
        role: 'ADMIN',
        image: null,
      },
      isLoading: false,
      error: null,
    };

    (useCurrentUserContext as jest.Mock).mockReturnValue(contextValue);

    const { result } = renderHook(() => useCurrentUser());

    expect(result.current).toEqual(contextValue);
  });
});
