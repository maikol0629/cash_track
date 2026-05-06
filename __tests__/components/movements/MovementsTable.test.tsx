import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MovementsTable } from '@/components/movements/table/MovementsTable';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { useMovements } from '@/lib/hooks/useMovements';
import { useFilteredMovements } from '@/lib/hooks/useFilteredMovements';

jest.mock('@/lib/hooks/useCurrentUser', () => ({
  useCurrentUser: jest.fn(),
}));

jest.mock('@/lib/hooks/useMovements', () => ({
  useMovements: jest.fn(),
}));

jest.mock('@/lib/hooks/useFilteredMovements', () => ({
  useFilteredMovements: jest.fn(),
}));

jest.mock('@/components/movements/table/MovementsFilters', () =>
  function MockMovementsFilters(props: any) {
    return (
      <div>
        <div data-testid='search-value'>{props.search}</div>
        <div data-testid='type-value'>{props.typeFilter}</div>
        <button type='button' onClick={() => props.setSearch('coffee')}>set-search</button>
        <button type='button' onClick={() => props.setTypeFilter('EXPENSE')}>set-type</button>
        <button type='button' onClick={props.onNew}>new</button>
      </div>
    );
  }
);

jest.mock('@/components/movements/table/MovementsTableView', () =>
  function MockMovementsTableView(props: any) {
    return (
      <div>
        <div data-testid='rows'>{props.data.length}</div>
        <button type='button' onClick={() => props.onEdit('m-1')}>edit-valid</button>
        <button type='button' onClick={() => props.onEdit('missing')}>edit-missing</button>
        <button type='button' onClick={() => props.onDelete('m-1')}>delete-valid</button>
        <button type='button' onClick={() => props.onDelete('missing')}>delete-missing</button>
      </div>
    );
  }
);

jest.mock('@/components/movements/MovementEditModal', () => ({
  MovementEditModal: ({ open, onOpenChange, onUpdated }: any) =>
    open ? (
      <div>
        <div>edit-modal</div>
        <button type='button' onClick={() => onOpenChange(false)}>edit-close</button>
        <button type='button' onClick={onUpdated}>edit-updated</button>
      </div>
    ) : null,
}));

jest.mock('@/components/movements/MovementDeleteDialog', () => ({
  MovementDeleteDialog: ({ open, onOpenChange, onDeleted }: any) =>
    open ? (
      <div>
        <div>delete-dialog</div>
        <button type='button' onClick={() => onOpenChange(false)}>delete-close</button>
        <button type='button' onClick={onDeleted}>delete-confirmed</button>
      </div>
    ) : null,
}));

describe('MovementsTable', () => {
  const reload = jest.fn();

  const items = [
    {
      id: 'm-1',
      concept: 'Salary',
      amount: 1000,
      date: '2025-01-01T00:00:00.000Z',
      type: 'INCOME',
      userId: 'user-1',
    },
    {
      id: 'm-2',
      concept: 'Coffee',
      amount: 5,
      date: '2025-01-02T00:00:00.000Z',
      type: 'EXPENSE',
      userId: 'user-1',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    (useCurrentUser as jest.Mock).mockReturnValue({
      user: {
        id: 'user-1',
        name: 'Jane',
        email: 'jane@example.com',
        role: 'ADMIN',
      },
    });

    (useMovements as jest.Mock).mockReturnValue({
      items,
      isLoading: false,
      reload,
    });

    (useFilteredMovements as jest.Mock).mockImplementation((source: any[]) => source);
  });

  it('throws when there is no authenticated user', () => {
    (useCurrentUser as jest.Mock).mockReturnValue({ user: null });

    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<MovementsTable onNew={jest.fn()} />)).toThrow(
      'User is not authenticated'
    );

    consoleError.mockRestore();
  });

  it('opens and closes edit/delete overlays only for existing movement ids', async () => {
    render(<MovementsTable onNew={jest.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'edit-missing' }));
    fireEvent.click(screen.getByRole('button', { name: 'delete-missing' }));
    expect(screen.queryByText('edit-modal')).not.toBeInTheDocument();
    expect(screen.queryByText('delete-dialog')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'edit-valid' }));
    expect(screen.getByText('edit-modal')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'edit-close' }));
    await waitFor(() =>
      expect(screen.queryByText('edit-modal')).not.toBeInTheDocument()
    );

    fireEvent.click(screen.getByRole('button', { name: 'delete-valid' }));
    expect(screen.getByText('delete-dialog')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'delete-close' }));
    await waitFor(() =>
      expect(screen.queryByText('delete-dialog')).not.toBeInTheDocument()
    );
  });

  it('reloads movements after successful edit or delete', async () => {
    render(<MovementsTable onNew={jest.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'edit-valid' }));
    fireEvent.click(screen.getByRole('button', { name: 'edit-updated' }));

    fireEvent.click(screen.getByRole('button', { name: 'delete-valid' }));
    fireEvent.click(screen.getByRole('button', { name: 'delete-confirmed' }));

    await waitFor(() => expect(reload).toHaveBeenCalledTimes(2));
  });

  it('updates filter states and triggers onNew action', () => {
    const onNew = jest.fn();

    render(<MovementsTable onNew={onNew} />);

    expect(screen.getByTestId('search-value')).toHaveTextContent('');
    expect(screen.getByTestId('type-value')).toHaveTextContent('ALL');

    fireEvent.click(screen.getByRole('button', { name: 'set-search' }));
    fireEvent.click(screen.getByRole('button', { name: 'set-type' }));

    expect(screen.getByTestId('search-value')).toHaveTextContent('coffee');
    expect(screen.getByTestId('type-value')).toHaveTextContent('EXPENSE');

    fireEvent.click(screen.getByRole('button', { name: 'new' }));
    expect(onNew).toHaveBeenCalledTimes(1);
  });
});