import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogHeader } from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { useToast } from '@/components/ui/use-toast';
import { movementSchema, MovementFormValues } from './movementSchema';
import { MovementFormFields } from './MovementFormFields';
import { MovementFormActions } from './MovementFormActions';

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
    resolver: zodResolver(movementSchema),
    defaultValues: {
      concept: '',
      amount: 0,
      date: new Date().toISOString().slice(0, 10),
      type: 'INCOME',
    },
  });

  const { formState: { errors } } = form;

  const { showToast } = useToast();

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
        const error = await res.json().catch(() => ({
          message: 'Error al crear el movimiento',
        }));

        showToast({
          title: 'Error',
          description: error.message || 'No se pudo crear el movimiento',
          variant: 'destructive',
        });
        return;
      }

      showToast({
        title: 'Éxito',
        description: 'Movimiento creado correctamente',
        variant: 'success',
      });

      form.reset();
      onOpenChange(false);
      onCreated?.();
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
        title='Nuevo movimiento'
        description='Registra un ingreso o egreso.'
      />
      <Form methods={form} onSubmit={handleSubmit}>
        <MovementFormFields register={form.register} errors={errors} />
        <MovementFormActions
          onCancel={() => onOpenChange(false)}
          isSubmitting={isSubmitting}
          submitLabel='Guardar'
        />
      </Form>
    </Dialog>
  );
};
