import { renderHook, waitFor, act } from '@testing-library/react';
import { useMovements } from '@/lib/hooks/useMovements';

const mockShowToast = jest.fn();

jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    showToast: mockShowToast,
  }),
}));

const mockFetch = jest.fn();
globalThis.fetch = mockFetch as unknown as typeof fetch;

describe('useMovements', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads movements and supports reload', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            { id: '1', concept: 'Salary', amount: 1200 },
            { id: '2', concept: 'Rent', amount: 500 },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

    const { result } = renderHook(() => useMovements());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.items).toHaveLength(2);

    await act(async () => {
      await result.current.reload();
    });

    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('shows a toast when the API returns an error response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Error al cargar los movimientos' }),
    });

    const { result } = renderHook(() => useMovements());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockShowToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Error',
        variant: 'destructive',
      })
    );
  });

  it('shows a toast on connection failures', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network down'));

    const { result } = renderHook(() => useMovements());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockShowToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Error de conexión',
        variant: 'destructive',
      })
    );
  });
});
