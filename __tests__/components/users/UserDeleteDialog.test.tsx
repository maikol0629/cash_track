import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { UserDeleteDialog } from '@/components/users/UserDeleteDialog';

const mockToast = jest.fn();

jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

const mockFetch = jest.fn();
globalThis.fetch = mockFetch as unknown as typeof fetch;

describe('UserDeleteDialog', () => {
  const user = {
    id: 'user-1',
    name: 'Jane',
    email: 'jane@example.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deletes the user and closes the dialog on success', async () => {
    const onOpenChange = jest.fn();
    const onDeleted = jest.fn();

    mockFetch.mockResolvedValueOnce({ ok: true });

    render(
      <UserDeleteDialog
        open
        onOpenChange={onOpenChange}
        user={user}
        onDeleted={onDeleted}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));

    await waitFor(() =>
      expect(mockFetch).toHaveBeenCalledWith('/api/users/user-1', {
        method: 'DELETE',
      })
    );

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Usuario eliminado',
        variant: 'success',
      })
    );
    expect(onDeleted).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('uses the specific error title for bad requests', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ message: 'No se puede eliminar' }),
    });

    render(
      <UserDeleteDialog
        open
        onOpenChange={jest.fn()}
        user={user}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));

    await waitFor(() =>
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'No se puede eliminar',
          variant: 'destructive',
        })
      )
    );
  });
});
