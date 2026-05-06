import React, { useState } from 'react';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { useMovements } from '@/lib/hooks/useMovements';
import { useFilteredMovements } from '@/lib/hooks/useFilteredMovements';
import MovementsFilters from './MovementsFilters';
import MovementsTableView from './MovementsTableView';
import { MovementEditModal } from '../MovementEditModal';
import { MovementDeleteDialog } from '../MovementDeleteDialog';

interface Movement {
  id: string;
  concept: string;
  amount: number;
  date: string;
  type: 'INCOME' | 'EXPENSE';
  userId: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
}

interface MovementsTableProps {
  onNew: () => void;
}

export const MovementsTable: React.FC<MovementsTableProps> = ({ onNew }) => {
  const { user } = useCurrentUser();
  const { items, isLoading, reload } = useMovements();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const data = useFilteredMovements(items, search, typeFilter, 'date', 'desc');

  const [edit, setEdit] = useState<Movement | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [del, setDel] = useState<Movement | null>(null);
  const [delOpen, setDelOpen] = useState(false);

  if (!user) {
    throw new Error('User is not authenticated');
  }

  const isAdmin = user.role === 'ADMIN'; // Safely handle isAdmin property

  const userData = {
    id: user.id,
    name: user.name || '',
    email: user.email,
  };

  return (
    <div>
      <MovementsFilters
        search={search}
        setSearch={setSearch}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        isAdmin={isAdmin}
        onNew={onNew}
      />

      <MovementsTableView
        data={data}
        isLoading={isLoading}
        user={userData}
        isAdmin={isAdmin}
        onEdit={(id) => {
          const movement = data.find((m) => m.id === id);
          if (movement) {
            setEdit(movement);
            setEditOpen(true);
          }
        }}
        onDelete={(id) => {
          const movement = data.find((m) => m.id === id);
          if (movement) {
            setDel(movement);
            setDelOpen(true);
          }
        }}
      />

      {edit && (
        <MovementEditModal
          open={editOpen}
          onOpenChange={(open) => {
            setEditOpen(open);
            if (!open) setEdit(null);
          }}
          movement={edit}
          user={userData}
          isAdmin={isAdmin}
          onUpdated={() => {
            setEditOpen(false);
            setEdit(null);
            reload();
          }}
        />
      )}

      {del && (
        <MovementDeleteDialog
          open={delOpen}
          onOpenChange={(open) => {
            setDelOpen(open);
            if (!open) setDel(null);
          }}
          movement={del}
          onDeleted={() => {
            setDelOpen(false);
            setDel(null);
            reload();
          }}
        />
      )}
    </div>
  );
};

export default MovementsTable;