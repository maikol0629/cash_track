import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import MovementsRow from '@/components/movements/table/MovementsRow';

describe('MovementsRow', () => {
  const movement = {
    concept: 'Coffee',
    amount: 20,
    date: '2025-01-15T00:00:00.000Z',
  };

  it('renders a row without actions when editing is disabled', () => {
    const { container } = render(
      <table>
        <tbody>
          <MovementsRow
            movement={movement}
            canEdit={false}
            onEdit={jest.fn()}
            onDelete={jest.fn()}
          />
        </tbody>
      </table>
    );

    expect(screen.getByText('Coffee')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
    expect(container.querySelector('button')).toBeNull();
  });

  it('opens the actions menu and triggers edit/delete callbacks', () => {
    const onEdit = jest.fn();
    const onDelete = jest.fn();

    const { container } = render(
      <table>
        <tbody>
          <MovementsRow
            movement={movement}
            canEdit
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </tbody>
      </table>
    );

    fireEvent.click(container.querySelector('button') as HTMLButtonElement);

    fireEvent.click(screen.getByText('Editar'));
    fireEvent.click(container.querySelector('button') as HTMLButtonElement);
    fireEvent.click(screen.getByText('Eliminar'));

    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});
