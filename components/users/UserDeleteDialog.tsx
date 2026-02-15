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

export interface UserForDelete {
  id: string;
  name: string | null;
  email: string;
}

interface UserDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserForDelete;
  onDeleted?: () => void;
}

export const UserDeleteDialog = ({
  open,
  onOpenChange,
  user,
  onDeleted,
}: UserDeleteDialogProps) => {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'DELETE',
      });

      if (res.status === 400) {
        const body = (await res.json()) as { message?: string };
        toast({
          title: 'No se puede eliminar',
          description:
            body.message ?? 'No se puede eliminar el último usuario admin.',
          variant: 'destructive',
        });
        return;
      }

      if (!res.ok) {
        toast({
          title: 'Error al eliminar',
          description: 'No se pudo eliminar el usuario.',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Usuario eliminado',
        description: 'El usuario se eliminó correctamente.',
        variant: 'success',
      });

      onDeleted?.();
      onOpenChange(false);
    } catch {
      toast({
        title: 'Error inesperado',
        description: 'Ocurrió un error al eliminar el usuario.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogHeader>
        <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
        <AlertDialogDescription>
          Se eliminará el usuario &quot;{user.name ?? user.email}&quot; y sus
          datos asociados. Esta acción no se puede deshacer.
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
