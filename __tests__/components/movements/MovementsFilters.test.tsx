import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import MovementsFilters from '@/components/movements/table/MovementsFilters';

describe('MovementsFilters', () => {
  it('updates search and type filters', () => {
    const setSearch = jest.fn();
    const setTypeFilter = jest.fn();

    render(
      <MovementsFilters
        search=''
        setSearch={setSearch}
        typeFilter='ALL'
        setTypeFilter={setTypeFilter}
        isAdmin
        onNew={jest.fn()}
      />
    );

    fireEvent.change(screen.getByPlaceholderText('Buscar...'), {
      target: { value: 'salary' },
    });

    fireEvent.change(screen.getByDisplayValue('Todos'), {
      target: { value: 'EXPENSE' },
    });

    expect(setSearch).toHaveBeenCalledWith('salary');
    expect(setTypeFilter).toHaveBeenCalledWith('EXPENSE');
  });

  it('renders the new button only for admins', () => {
    const onNew = jest.fn();

    const { rerender } = render(
      <MovementsFilters
        search=''
        setSearch={jest.fn()}
        typeFilter='ALL'
        setTypeFilter={jest.fn()}
        isAdmin
        onNew={onNew}
      />
    );

    expect(screen.getByRole('button', { name: 'Nuevo' })).toBeInTheDocument();

    rerender(
      <MovementsFilters
        search=''
        setSearch={jest.fn()}
        typeFilter='ALL'
        setTypeFilter={jest.fn()}
        isAdmin={false}
        onNew={onNew}
      />
    );

    expect(screen.queryByRole('button', { name: 'Nuevo' })).not.toBeInTheDocument();
  });
});
