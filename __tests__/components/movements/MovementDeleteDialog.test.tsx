import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MovementDeleteDialog } from '@/components/movements/MovementDeleteDialog';

const mockShowToast = jest.fn();

jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    showToast: mockShowToast,
  }),
}));

const mockFetch = jest.fn();
globalThis.fetch = mockFetch as unknown as typeof fetch;

describe('MovementDeleteDialog', () => {
  const movement = {
    id: 'movement-1',
    concept: 'Coffee',
    amount: 20,
    type: 'EXPENSE' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deletes the movement and closes the dialog on success', async () => {
    const onOpenChange = jest.fn();
    const onDeleted = jest.fn();

    mockFetch.mockResolvedValueOnce({ ok: true });

    render(
      <MovementDeleteDialog
        open
        onOpenChange={onOpenChange}
        movement={movement}
        onDeleted={onDeleted}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));

    await waitFor(() =>
      expect(mockFetch).toHaveBeenCalledWith('/api/movements/movement-1', {
        method: 'DELETE',
      })
    );

    expect(mockShowToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Movimiento eliminado',
        variant: 'success',
      })
    );
    expect(onDeleted).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('shows a destructive toast when deletion fails', async () => {
    const onOpenChange = jest.fn();

    mockFetch.mockResolvedValueOnce({ ok: false });

    render(
      <MovementDeleteDialog
        open
        onOpenChange={onOpenChange}
        movement={movement}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));

    await waitFor(() =>
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Error al eliminar',
          variant: 'destructive',
        })
      )
    );

    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });

  it('shows unexpected error toast when request throws', async () => {
    const onOpenChange = jest.fn();

    mockFetch.mockRejectedValueOnce(new Error('network down'));

    render(
      <MovementDeleteDialog
        open
        onOpenChange={onOpenChange}
        movement={movement}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));

    await waitFor(() =>
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Error inesperado',
          variant: 'destructive',
        })
      )
    );

    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });
});
