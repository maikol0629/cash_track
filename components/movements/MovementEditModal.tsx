import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogHeader } from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { useToast } from '@/components/ui/use-toast';
import { movementSchema, MovementFormValues } from './movementSchema';
import { MovementFormFields } from './MovementFormFields';
import { MovementFormActions } from './MovementFormActions';

const schema = movementSchema;
export type MovementEditFormValues = MovementFormValues;

export interface MovementForEdit {
  id: string;
  concept: string;
  amount: number;
  date: string;
  type: 'INCOME' | 'EXPENSE';
}

interface MovementEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  movement: MovementForEdit;
  onUpdated?: () => void;
}

export const MovementEditModal = ({
  open,
  onOpenChange,
  movement,
  onUpdated,
}: MovementEditModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  const form = useForm<MovementEditFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      concept: movement.concept,
      amount: Number(movement.amount),
      date: movement.date.slice(0, 10),
      type: movement.type,
    },
  });

  useEffect(() => {
    if (!open) return;

    form.reset({
      concept: movement.concept,
      amount: Number(movement.amount),
      date: movement.date.slice(0, 10),
      type: movement.type,
    });
  }, [movement, open, form]);

  const { formState: { errors } } = form;

  const handleSubmit = async (values: MovementEditFormValues) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/movements/${movement.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          concept: values.concept,
          amount: values.amount,
          date: new Date(values.date).toISOString(),
          type: values.type,
        }),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({
          message: 'No se pudo actualizar el movimiento',
        }));

        showToast({
          title: 'Error al actualizar',
          description: error.message || 'No se pudo actualizar el movimiento.',
          variant: 'destructive',
        });
        return;
      }

      showToast({
        title: 'Movimiento actualizado',
        description: 'El movimiento se actualizó correctamente.',
        variant: 'success',
      });

      onUpdated?.();
      onOpenChange(false);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'No se pudo conectar con el servidor';

      showToast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader
        title='Editar movimiento'
        description='Actualiza los datos del movimiento seleccionado.'
      />
      <Form methods={form} onSubmit={handleSubmit}>
        <MovementFormFields register={form.register} errors={errors} />
        <MovementFormActions
          onCancel={() => onOpenChange(false)}
          isSubmitting={isSubmitting}
          submitLabel='Guardar cambios'
        />
      </Form>
    </Dialog>
  );
};
