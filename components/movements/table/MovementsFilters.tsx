import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface MovementsFiltersProps {
  search: string;
  setSearch: (value: string) => void;
  typeFilter: string;
  setTypeFilter: (value: string) => void;
  isAdmin: boolean;
  onNew: () => void;
}

const MovementsFilters: React.FC<MovementsFiltersProps> = ({
  search,
  setSearch,
  typeFilter,
  setTypeFilter,
  isAdmin,
  onNew,
}) => {
  return (
    <div className='flex flex-wrap items-center justify-between gap-3'>
      <div className='flex gap-2'>
        <Input
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          placeholder="Buscar..."
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="ALL">Todos</option>
          <option value="INCOME">Ingresos</option>
          <option value="EXPENSE">Egresos</option>
        </select>
      </div>

      {isAdmin && <Button onClick={onNew}>Nuevo</Button>}
    </div>
  );
};

export default MovementsFilters;