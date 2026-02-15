import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogHeader } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Form, FormField, FormActions } from '@/components/ui/form';
import { Save, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const schema = z.object({
  concept: z.string().min(1, 'El concepto es requerido'),
  amount: z.number().positive('El monto debe ser mayor que 0'),
  date: z.string().min(1, 'La fecha es requerida'),
  type: z.enum(['INCOME', 'EXPENSE']),
});

export type MovementEditFormValues = z.infer<typeof schema>;

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
  const { toast } = useToast();

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

  const {
    formState: { errors },
  } = form;

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

        toast({
          title: 'Error al actualizar',
          description: error.message || 'No se pudo actualizar el movimiento.',
          variant: 'destructive',
        });
        return;
      }

      toast({
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

      toast({
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
        <FormField
          label='Concepto'
          name='concept'
          error={errors.concept?.message}
        >
          <Input
            id='concept'
            {...form.register('concept')}
            placeholder='Descripción del movimiento'
          />
        </FormField>

        <FormField label='Monto' name='amount' error={errors.amount?.message}>
          <Input
            id='amount'
            type='number'
            step='0.01'
            {...form.register('amount', { valueAsNumber: true })}
          />
        </FormField>

        <FormField label='Fecha' name='date' error={errors.date?.message}>
          <Input id='date' type='date' {...form.register('date')} />
        </FormField>

        <FormField label='Tipo' name='type' error={errors.type?.message}>
          <div className='flex gap-4 text-sm'>
            <label className='inline-flex items-center gap-1'>
              <input type='radio' value='INCOME' {...form.register('type')} />
              <span>Ingreso</span>
            </label>
            <label className='inline-flex items-center gap-1'>
              <input type='radio' value='EXPENSE' {...form.register('type')} />
              <span>Egreso</span>
            </label>
          </div>
        </FormField>

        <FormActions>
          <Button
            type='button'
            variant='ghost'
            onClick={() => onOpenChange(false)}
          >
            <X className='mr-2 h-4 w-4' />
            Cancelar
          </Button>
          <Button type='submit' disabled={isSubmitting} className='gap-2'>
            {isSubmitting ? (
              <span className='h-3 w-3 animate-spin rounded-full border-[2px] border-current border-r-transparent' />
            ) : (
              <Save className='h-4 w-4' />
            )}
            {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </FormActions>
      </Form>
    </Dialog>
  );
};
