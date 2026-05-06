import React from 'react';
import { TableRow, TableCell } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';

interface MovementsRowProps {
  movement: {
    concept: string;
    amount: number;
    date: string;
  };
  canEdit: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

const MovementsRow: React.FC<MovementsRowProps> = ({
  movement,
  canEdit,
  onEdit,
  onDelete,
}) => {
  return (
    <TableRow>
      <TableCell>{movement.concept}</TableCell>
      <TableCell className='text-right'>{movement.amount}</TableCell>
      <TableCell>{new Date(movement.date).toLocaleDateString()}</TableCell>
      <TableCell className='text-right'>
        {canEdit && (
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant='ghost' size='sm'>
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={onEdit}>Editar</DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete}>Eliminar</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </TableCell>
    </TableRow>
  );
};

export default MovementsRow;