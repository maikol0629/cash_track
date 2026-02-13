import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogHeader } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Form, FormField, FormActions } from '@/components/ui/form';

// Esquema de validación del formulario de creación de movimiento
const schema = z.object({
  concept: z.string().min(1, 'El concepto es requerido'),
  // If the value comes as string from the input, coerce it:
  amount: z.number().positive('El monto debe ser mayor que 0'),
  date: z.string().min(1, 'La fecha es requerida'),
  type: z.enum(['INCOME', 'EXPENSE']),
});

type MovementFormValues = z.infer<typeof schema>;

interface MovementFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

// Modal responsable de crear un nuevo movimiento vía /api/movements
export const MovementFormModal = ({
  open,
  onOpenChange,
  onCreated,
}: MovementFormModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<MovementFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      concept: '',
      amount: 0,
      date: new Date().toISOString().slice(0, 10),
      type: 'INCOME',
    },
  });

  const {
    formState: { errors },
  } = form;

  // Envía el formulario al backend y cierra el modal al crear correctamente
  const handleSubmit = async (values: MovementFormValues) => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/movements', {
        method: 'POST',
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
        // eslint-disable-next-line no-console
        console.error('Error al crear movimiento');
        return;
      }

      form.reset();
      onOpenChange(false);
      onCreated?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader
        title='Nuevo movimiento'
        description='Registra un ingreso o egreso.'
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
              Ingreso
            </label>
            <label className='inline-flex items-center gap-1'>
              <input type='radio' value='EXPENSE' {...form.register('type')} />
              Egreso
            </label>
          </div>
        </FormField>

        <FormActions>
          <Button
            type='button'
            variant='ghost'
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button type='submit' disabled={isSubmitting}>
            Guardar
          </Button>
        </FormActions>
      </Form>
    </Dialog>
  );
};
