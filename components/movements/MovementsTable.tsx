import { useEffect, useMemo, useState } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Pencil, Trash2, PlusCircle } from 'lucide-react';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import type { Role } from '@/lib/auth';
import { MovementEditModal } from '@/components/movements/MovementEditModal';
import { MovementDeleteDialog } from '@/components/movements/MovementDeleteDialog';

interface MovementUser {
  id: string;
  name: string | null;
  email: string;
}

interface Movement {
  id: string;
  concept: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  date: string;
  user: MovementUser;
}

interface ApiResponse {
  data: Movement[];
}

type SortField = 'date' | 'amount' | 'concept';

type SortDirection = 'asc' | 'desc';

interface MovementsTableProps {
  onNew?: () => void;
}

export const MovementsTable = ({ onNew }: MovementsTableProps) => {
  const { user, isLoading, error } = useCurrentUser();
  const isAdmin: boolean = (user?.role as Role | undefined) === 'ADMIN';
  const [items, setItems] = useState<Movement[]>([]);
  const [isLoadingMovements, setIsLoadingMovements] = useState<boolean>(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'INCOME' | 'EXPENSE'>(
    'ALL'
  );
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const [movementToEdit, setMovementToEdit] = useState<Movement | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [movementToDelete, setMovementToDelete] = useState<Movement | null>(
    null
  );
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const loadMovements = async () => {
    try {
      setIsLoadingMovements(true);
      const res = await fetch('/api/movements');
      if (!res.ok) return;
      const json: ApiResponse = await res.json();
      setItems(json.data);
    } finally {
      setIsLoadingMovements(false);
    }
  };

  useEffect(() => {
    void loadMovements();
  }, []);

  const filteredAndSorted = useMemo(() => {
    const term = search.toLowerCase();

    let result = items.filter((m) => {
      const matchesSearch =
        m.concept.toLowerCase().includes(term) ||
        (m.user.name ?? m.user.email).toLowerCase().includes(term);

      const matchesType = typeFilter === 'ALL' ? true : m.type === typeFilter;

      return matchesSearch && matchesType;
    });

    result = result.sort((a, b) => {
      let compare = 0;

      if (sortField === 'date') {
        compare = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortField === 'amount') {
        compare = a.amount - b.amount;
      } else {
        compare = a.concept.localeCompare(b.concept);
      }

      return sortDirection === 'asc' ? compare : -compare;
    });

    return result;
  }, [items, search, typeFilter, sortField, sortDirection]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleEditClick = (movement: Movement) => {
    setMovementToEdit(movement);
    setIsEditOpen(true);
  };

  const handleDeleteClick = (movement: Movement) => {
    setMovementToDelete(movement);
    setIsDeleteOpen(true);
  };

  if (isLoading) {
    return (
      <section className='flex min-h-[200px] items-center justify-center'>
        <div className='text-sm text-muted-foreground'>Cargando usuario…</div>
      </section>
    );
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <section className='space-y-4'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div className='flex flex-wrap items-center gap-2'>
          <Input
            placeholder='Buscar por concepto o usuario'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='w-64'
          />
          <select
            className='h-9 rounded-md border border-input bg-background px-2 text-sm'
            value={typeFilter}
            onChange={(e) =>
              setTypeFilter(e.target.value as 'ALL' | 'INCOME' | 'EXPENSE')
            }
          >
            <option value='ALL'>Todos</option>
            <option value='INCOME'>Ingresos</option>
            <option value='EXPENSE'>Egresos</option>
          </select>
        </div>
        {isAdmin && (
          <Button onClick={onNew} className='gap-2'>
            <PlusCircle className='h-4 w-4' />
            Nuevo movimiento
          </Button>
        )}
      </div>

      <div className='overflow-x-auto rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                onClick={() => toggleSort('concept')}
                className='cursor-pointer'
              >
                Concepto
              </TableHead>
              <TableHead
                onClick={() => toggleSort('amount')}
                className='cursor-pointer text-right'
              >
                Monto
              </TableHead>
              <TableHead
                onClick={() => toggleSort('date')}
                className='cursor-pointer'
              >
                Fecha
              </TableHead>
              <TableHead>Usuario</TableHead>
              <TableHead className='text-right'>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingMovements && (
              <>
                {[1, 2, 3].map((key) => (
                  <TableRow key={key}>
                    <TableCell>
                      <div className='h-4 w-32 animate-pulse rounded bg-muted' />
                    </TableCell>
                    <TableCell className='text-right'>
                      <div className='ml-auto h-4 w-16 animate-pulse rounded bg-muted' />
                    </TableCell>
                    <TableCell>
                      <div className='h-4 w-24 animate-pulse rounded bg-muted' />
                    </TableCell>
                    <TableCell>
                      <div className='h-4 w-40 animate-pulse rounded bg-muted' />
                    </TableCell>
                    <TableCell className='text-right'>
                      <div className='h-4 w-6 animate-pulse rounded bg-muted' />
                    </TableCell>
                  </TableRow>
                ))}
              </>
            )}
            {!isLoadingMovements &&
              filteredAndSorted.map((movement) => (
                <TableRow key={movement.id}>
                  <TableCell>{movement.concept}</TableCell>
                  <TableCell className='text-right'>
                    {movement.type === 'EXPENSE' ? '-' : ''}
                    {Number(movement.amount).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    {new Date(movement.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {movement.user.name ?? movement.user.email}
                  </TableCell>
                  <TableCell className='text-right'>
                    {(isAdmin || movement.user.id === user?.id) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger>
                          <Button
                            variant='ghost'
                            size='sm'
                            aria-label='Acciones'
                          >
                            <MoreHorizontal className='h-4 w-4' />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem
                            onClick={() => handleEditClick(movement)}
                          >
                            <Pencil className='mr-2 h-4 w-4' />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteClick(movement)}
                          >
                            <Trash2 className='mr-2 h-4 w-4 text-red-600' />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            {!isLoadingMovements && filteredAndSorted.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className='text-center text-sm text-muted-foreground'
                >
                  No hay movimientos para mostrar.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {movementToEdit && (
        <MovementEditModal
          open={isEditOpen}
          onOpenChange={(open) => {
            setIsEditOpen(open);
            if (!open) {
              setMovementToEdit(null);
            }
          }}
          movement={movementToEdit}
          onUpdated={loadMovements}
        />
      )}

      {movementToDelete && (
        <MovementDeleteDialog
          open={isDeleteOpen}
          onOpenChange={(open) => {
            setIsDeleteOpen(open);
            if (!open) {
              setMovementToDelete(null);
            }
          }}
          movement={{
            id: movementToDelete.id,
            concept: movementToDelete.concept,
            amount: movementToDelete.amount,
          }}
          onDeleted={loadMovements}
        />
      )}
    </section>
  );
};
