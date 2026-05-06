import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form';
import { MovementFormValues } from './movementSchema';

interface MovementFormFieldsProps {
  register: UseFormRegister<MovementFormValues>;
  errors: FieldErrors<MovementFormValues>;
}

export const MovementFormFields = ({
  register,
  errors,
}: MovementFormFieldsProps) => {
  return (
    <>
      <FormField
        label='Concepto'
        name='concept'
        error={errors.concept?.message}
      >
        <Input
          id='concept'
          {...register('concept')}
          placeholder='Descripción del movimiento'
        />
      </FormField>

      <FormField label='Monto' name='amount' error={errors.amount?.message}>
        <Input
          id='amount'
          type='number'
          step='0.01'
          {...register('amount', { valueAsNumber: true })}
        />
      </FormField>

      <FormField label='Fecha' name='date' error={errors.date?.message}>
        <Input id='date' type='date' {...register('date')} />
      </FormField>

      <FormField label='Tipo' name='type' error={errors.type?.message}>
        <div className='flex gap-4 text-sm'>
          <label className='inline-flex items-center gap-1'>
            <input type='radio' value='INCOME' {...register('type')} />
            <span>Ingreso</span>
          </label>
          <label className='inline-flex items-center gap-1'>
            <input type='radio' value='EXPENSE' {...register('type')} />
            <span>Egreso</span>
          </label>
        </div>
      </FormField>
    </>
  );
};
