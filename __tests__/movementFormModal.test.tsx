import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MovementFormModal } from '@/components/movements/MovementFormModal';

const mockFetch = jest.fn();

global.fetch = mockFetch as unknown as typeof fetch;

describe('MovementFormModal', () => {
  const setup = () => {
    const onOpenChange = jest.fn();
    const onCreated = jest.fn();

    render(
      <MovementFormModal
        open
        onOpenChange={onOpenChange}
        onCreated={onCreated}
      />
    );

    return { onOpenChange, onCreated };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows validation errors when submitting empty form', async () => {
    setup();

    const conceptInput = screen.getByLabelText('Concepto');
    const amountInput = screen.getByLabelText('Monto');

    fireEvent.change(conceptInput, { target: { value: '' } });
    fireEvent.change(amountInput, { target: { value: '' } });

    const submitButton = screen.getByRole('button', { name: 'Guardar' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('El concepto es requerido')).toBeInTheDocument();
    });
  });

  it('submits form successfully and closes modal', async () => {
    const { onOpenChange, onCreated } = setup();

    mockFetch.mockResolvedValueOnce({ ok: true });

    const conceptInput = screen.getByLabelText('Concepto');
    const amountInput = screen.getByLabelText('Monto');
    const dateInput = screen.getByLabelText('Fecha');
    const incomeRadio = screen.getByLabelText('Ingreso');

    fireEvent.change(conceptInput, { target: { value: 'Salary' } });
    fireEvent.change(amountInput, { target: { value: '1000' } });
    fireEvent.change(dateInput, { target: { value: '2025-01-01' } });
    fireEvent.click(incomeRadio);

    const submitButton = screen.getByRole('button', { name: 'Guardar' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/movements', expect.anything());
    });

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onCreated).toHaveBeenCalled();
  });

  it('handles API error without closing modal', async () => {
    const { onOpenChange, onCreated } = setup();

    mockFetch.mockResolvedValueOnce({ ok: false });

    const conceptInput = screen.getByLabelText('Concepto');
    const amountInput = screen.getByLabelText('Monto');
    const dateInput = screen.getByLabelText('Fecha');
    const incomeRadio = screen.getByLabelText('Ingreso');

    fireEvent.change(conceptInput, { target: { value: 'Salary' } });
    fireEvent.change(amountInput, { target: { value: '1000' } });
    fireEvent.change(dateInput, { target: { value: '2025-01-01' } });
    fireEvent.click(incomeRadio);

    const submitButton = screen.getByRole('button', { name: 'Guardar' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    expect(onOpenChange).not.toHaveBeenCalledWith(false);
    expect(onCreated).not.toHaveBeenCalled();
  });
});
