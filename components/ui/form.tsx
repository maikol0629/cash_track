import * as React from 'react';
import type { FieldValues, UseFormReturn } from 'react-hook-form';
import { FormProvider } from 'react-hook-form';

interface FormProps<TFieldValues extends FieldValues> {
  children: React.ReactNode;
  methods: UseFormReturn<TFieldValues>;
  onSubmit: (values: TFieldValues) => void | Promise<void>;
}

export const Form = <TFieldValues extends FieldValues>({
  children,
  methods,
  onSubmit,
}: FormProps<TFieldValues>) => (
  <FormProvider {...methods}>
    <form onSubmit={methods.handleSubmit(onSubmit)} className='space-y-4'>
      {children}
    </form>
  </FormProvider>
);

interface FormFieldProps {
  label: string;
  name: string;
  children: React.ReactNode;
  error?: string;
}

export const FormField = ({ label, name, children, error }: FormFieldProps) => (
  <div className='space-y-1'>
    <label htmlFor={name} className='block text-sm font-medium text-foreground'>
      {label}
    </label>
    {children}
    {error && <p className='text-xs text-red-500'>{error}</p>}
  </div>
);

interface FormActionsProps {
  children: React.ReactNode;
}

export const FormActions = ({ children }: FormActionsProps) => (
  <div className='flex justify-end gap-2 pt-2'>{children}</div>
);
