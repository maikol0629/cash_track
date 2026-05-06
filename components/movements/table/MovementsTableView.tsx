import React from 'react';
import { Table, TableBody } from '@/components/ui/table';
import MovementsRow from './MovementsRow';

interface Movement {
  id: string;
  concept: string;
  amount: number;
  date: string;
  userId: string;
}

interface MovementsTableViewProps {
  data: Movement[];
  isLoading: boolean;
  user: { id: string; name: string; email: string };
  isAdmin: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const MovementsTableView: React.FC<MovementsTableViewProps> = ({
  data,
  isLoading,
  user,
  isAdmin,
  onEdit,
  onDelete,
}) => {
  if (isLoading) return <div>Cargando...</div>;

  if (data.length === 0) {
    return <div>No hay movimientos</div>;
  }

  return (
    <Table>
      <TableBody>
        {data.map((m: Movement) => (
          <MovementsRow
            key={m.id}
            movement={m}
            canEdit={isAdmin || m.userId === user.id}
            onEdit={() => onEdit(m.id)}
            onDelete={() => onDelete(m.id)}
          />
        ))}
      </TableBody>
    </Table>
  );
};

export default MovementsTableView;