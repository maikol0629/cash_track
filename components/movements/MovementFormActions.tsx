import { Button } from '@/components/ui/button';
import { FormActions } from '@/components/ui/form';
import { Save, X } from 'lucide-react';

interface MovementFormActionsProps {
  onCancel: () => void;
  isSubmitting: boolean;
  submitLabel?: string;
}

export const MovementFormActions = ({
  onCancel,
  isSubmitting,
  submitLabel = 'Guardar',
}: MovementFormActionsProps) => {
  return (
    <FormActions>
      <Button
        type='button'
        variant='ghost'
        onClick={onCancel}
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
        {isSubmitting ? 'Guardando...' : submitLabel}
      </Button>
    </FormActions>
  );
};
