import { render, screen } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import MovementsTableView from '@/components/movements/table/MovementsTableView';

jest.mock('@/components/movements/table/MovementsRow', () =>
  function MockMovementsRow({ movement, canEdit, onEdit, onDelete }: any) {
    return (
      <tr>
        <td>{movement.concept}</td>
        <td>{canEdit ? 'can-edit' : 'read-only'}</td>
        <td>
          <button type='button' onClick={onEdit}>edit-row-{movement.id}</button>
          <button type='button' onClick={onDelete}>delete-row-{movement.id}</button>
        </td>
      </tr>
    );
  }
);

describe('MovementsTableView', () => {
  const user = { id: 'user-1', name: 'Jane', email: 'jane@example.com' };

  it('renders the loading state', () => {
    render(
      <MovementsTableView
        data={[]}
        isLoading
        user={user}
        isAdmin={false}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />
    );

    expect(screen.getByText('Cargando...')).toBeInTheDocument();
  });

  it('renders the empty state', () => {
    render(
      <MovementsTableView
        data={[]}
        isLoading={false}
        user={user}
        isAdmin={false}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />
    );

    expect(screen.getByText('No hay movimientos')).toBeInTheDocument();
  });

  it('renders movements rows', () => {
    const onEdit = jest.fn();
    const onDelete = jest.fn();

    render(
      <MovementsTableView
        data={[
          {
            id: 'm-1',
            concept: 'Salary',
            amount: 1200,
            date: '2025-01-15T00:00:00.000Z',
            userId: 'user-1',
          },
          {
            id: 'm-2',
            concept: 'Rent',
            amount: 500,
            date: '2025-01-20T00:00:00.000Z',
            userId: 'user-2',
          },
        ]}
        isLoading={false}
        user={user}
        isAdmin={false}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );

    expect(screen.getByText('Salary')).toBeInTheDocument();
    expect(screen.getByText('Rent')).toBeInTheDocument();

    const markers = screen.getAllByText(/can-edit|read-only/);
    expect(markers[0]).toHaveTextContent('can-edit');
    expect(markers[1]).toHaveTextContent('read-only');

    fireEvent.click(screen.getByRole('button', { name: 'edit-row-m-1' }));
    fireEvent.click(screen.getByRole('button', { name: 'delete-row-m-2' }));

    expect(onEdit).toHaveBeenCalledWith('m-1');
    expect(onDelete).toHaveBeenCalledWith('m-2');
  });
});
