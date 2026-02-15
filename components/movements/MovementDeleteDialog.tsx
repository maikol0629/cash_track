import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { Trash2, X } from 'lucide-react';
import { useState } from 'react';

interface MovementForDelete {
  id: string;
  concept: string;
  amount: number;
}

interface MovementDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  movement: MovementForDelete;
  onDeleted?: () => void;
}

export const MovementDeleteDialog = ({
  open,
  onOpenChange,
  movement,
  onDeleted,
}: MovementDeleteDialogProps) => {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/movements/${movement.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        toast({
          title: 'Error al eliminar',
          description: 'No se pudo eliminar el movimiento.',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Movimiento eliminado',
        description: 'El movimiento se eliminó correctamente.',
        variant: 'success',
      });

      onDeleted?.();
      onOpenChange(false);
    } catch {
      toast({
        title: 'Error inesperado',
        description: 'Ocurrió un error al eliminar el movimiento.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogHeader>
        <AlertDialogTitle>¿Eliminar movimiento?</AlertDialogTitle>
        <AlertDialogDescription>
          Se eliminará el movimiento &quot;{movement.concept}&quot; por{' '}
          {movement.amount < 0
            ? movement.amount.toFixed(2)
            : movement.amount.toFixed(2)}
          . Esta acción no se puede deshacer.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel onClick={() => onOpenChange(false)}>
          <X className='mr-2 h-4 w-4' />
          Cancelar
        </AlertDialogCancel>
        <AlertDialogAction
          onClick={handleConfirm}
          disabled={isDeleting}
          className='gap-2'
        >
          {isDeleting ? (
            <span className='h-3 w-3 animate-spin rounded-full border-[2px] border-current border-r-transparent' />
          ) : (
            <Trash2 className='h-4 w-4 text-red-600' />
          )}
          {isDeleting ? 'Eliminando...' : 'Eliminar'}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialog>
  );
};
