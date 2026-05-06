import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MovementEditModal } from '@/components/movements/MovementEditModal';

const mockShowToast = jest.fn();

jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    showToast: mockShowToast,
  }),
}));

const mockFetch = jest.fn();
globalThis.fetch = mockFetch as unknown as typeof fetch;

describe('MovementEditModal', () => {
  const movement = {
    id: 'movement-1',
    concept: 'Salary',
    amount: 1200,
    date: '2025-01-15T00:00:00.000Z',
    type: 'INCOME' as const,
  };

  const user = { id: 'user-1', name: 'Jane', email: 'jane@example.com' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updates the movement and closes the modal on success', async () => {
    const onOpenChange = jest.fn();
    const onUpdated = jest.fn();

    mockFetch.mockResolvedValueOnce({ ok: true });

    render(
      <MovementEditModal
        open
        onOpenChange={onOpenChange}
        movement={movement}
        user={user}
        isAdmin
        onUpdated={onUpdated}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() => expect(mockFetch).toHaveBeenCalledWith(
      '/api/movements/movement-1',
      expect.objectContaining({ method: 'PATCH' })
    ));

    expect(mockShowToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Movimiento actualizado',
        variant: 'success',
      })
    );
    expect(onUpdated).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('shows an error toast when the API rejects the update', async () => {
    const onOpenChange = jest.fn();

    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'No se pudo actualizar' }),
    });

    render(
      <MovementEditModal
        open
        onOpenChange={onOpenChange}
        movement={movement}
        user={user}
        isAdmin
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() =>
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Error al actualizar',
          variant: 'destructive',
        })
      )
    );

    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });

  it('shows connection error when request throws', async () => {
    const onOpenChange = jest.fn();

    mockFetch.mockRejectedValueOnce(new Error('network unavailable'));

    render(
      <MovementEditModal
        open
        onOpenChange={onOpenChange}
        movement={movement}
        user={user}
        isAdmin
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() =>
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Error',
          description: 'network unavailable',
          variant: 'destructive',
        })
      )
    );

    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });
});
