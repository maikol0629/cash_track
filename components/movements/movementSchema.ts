import { z } from 'zod';

export const movementSchema = z.object({
  concept: z.string().min(1, 'El concepto es requerido'),
  amount: z.number().positive('El monto debe ser mayor que 0'),
  date: z.string().min(1, 'La fecha es requerida'),
  type: z.enum(['INCOME', 'EXPENSE']),
});

export type MovementFormValues = z.infer<typeof movementSchema>;
