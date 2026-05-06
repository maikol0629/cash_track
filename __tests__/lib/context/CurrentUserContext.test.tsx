import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  CurrentUserProvider,
  useCurrentUserContext,
} from '@/lib/context/CurrentUserContext';

const mockFetch = jest.fn();
globalThis.fetch = mockFetch as unknown as typeof fetch;

const Probe = () => {
  const { user, isLoading, error, refetch } = useCurrentUserContext();

  return (
    <div>
      <div data-testid='loading'>{isLoading ? 'loading' : 'ready'}</div>
      <div data-testid='error'>{error ?? ''}</div>
      <div data-testid='user'>{user?.email ?? 'no-user'}</div>
      <button type='button' onClick={() => void refetch()}>
        Refetch
      </button>
    </div>
  );
};

describe('CurrentUserContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads the current user and supports refetching', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'user-1',
          name: 'Jane',
          email: 'jane@example.com',
          phone: null,
          role: 'ADMIN',
          image: null,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'user-1',
          name: 'Jane',
          email: 'jane@example.com',
          phone: null,
          role: 'ADMIN',
          image: null,
        }),
      });

    render(
      <CurrentUserProvider>
        <Probe />
      </CurrentUserProvider>
    );

    await waitFor(() =>
      expect(screen.getByTestId('loading')).toHaveTextContent('ready')
    );
    expect(screen.getByTestId('user')).toHaveTextContent('jane@example.com');
    expect(screen.getByTestId('error')).toHaveTextContent('');

    fireEvent.click(screen.getByRole('button', { name: 'Refetch' }));

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2));
  });

  it('clears the user on unauthorized responses', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 401 });

    render(
      <CurrentUserProvider>
        <Probe />
      </CurrentUserProvider>
    );

    await waitFor(() =>
      expect(screen.getByTestId('loading')).toHaveTextContent('ready')
    );

    expect(screen.getByTestId('user')).toHaveTextContent('no-user');
    expect(screen.getByTestId('error')).toHaveTextContent('');
  });

  it('stores the error message when the request fails', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network down'));

    render(
      <CurrentUserProvider>
        <Probe />
      </CurrentUserProvider>
    );

    await waitFor(() =>
      expect(screen.getByTestId('loading')).toHaveTextContent('ready')
    );

    expect(screen.getByTestId('user')).toHaveTextContent('no-user');
    expect(screen.getByTestId('error')).toHaveTextContent('Network down');
  });
});
