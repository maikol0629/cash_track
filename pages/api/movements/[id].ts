import type { NextApiResponse } from 'next';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { withAuth, type AuthenticatedRequest } from '@/lib/auth';

interface UpdateMovementBody {
  concept?: unknown;
  amount?: unknown;
  date?: unknown;
  type?: unknown;
}

// Schema de validación Zod para actualizar movimientos
const updateMovementSchema = z
  .object({
    concept: z
      .string()
      .min(1)
      .max(200)
      .transform((val) => val.trim())
      .refine((val) => !/[<>]/.test(val), {
        message: 'Concept cannot contain HTML tags',
      })
      .optional(),
    amount: z
      .number()
      .positive()
      .max(999999999, 'Amount exceeds maximum allowed value')
      .refine((val) => Number.isSafeInteger(val * 100), {
        message: 'Amount must be a valid monetary value',
      })
      .optional(),
    date: z.string().datetime().optional(),
    type: z.enum(['INCOME', 'EXPENSE']).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

/**
 * @swagger
 * /api/movements/{id}:
 *   patch:
 *     summary: Actualizar un movimiento
 *     description: Actualiza los campos de un movimiento existente (concepto, monto, fecha y tipo). Los administradores pueden editar cualquier movimiento, los usuarios solo sus propios movimientos.
 *     tags:
 *       - Movements
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del movimiento a actualizar.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               concept:
 *                 type: string
 *               amount:
 *                 type: number
 *               date:
 *                 type: string
 *                 format: date-time
 *               type:
 *                 type: string
 *                 enum: [INCOME, EXPENSE]
 *           example:
 *             concept: "Pago actualizado"
 *             amount: 2000.75
 *             date: "2025-01-20T00:00:00.000Z"
 *             type: "INCOME"
 *     responses:
 *       200:
 *         description: Movimiento actualizado correctamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 concept:
 *                   type: string
 *                 amount:
 *                   type: number
 *                 type:
 *                   type: string
 *                   enum: [INCOME, EXPENSE]
 *                 date:
 *                   type: string
 *                   format: date-time
 *                 userId:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *             example:
 *               id: "mv_123"
 *               concept: "Pago actualizado"
 *               amount: 2000.75
 *               type: "INCOME"
 *               date: "2025-01-20T00:00:00.000Z"
 *               userId: "user_123"
 *               createdAt: "2025-01-10T12:00:00.000Z"
 *               updatedAt: "2025-01-20T12:00:00.000Z"
 *       400:
 *         description: Datos inválidos o sin campos a actualizar.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             example:
 *               message: "No valid fields to update"
 *       401:
 *         description: No autenticado.
 *       403:
 *         description: No autorizado para modificar este movimiento.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 code:
 *                   type: string
 *             examples:
 *               notOwner:
 *                 summary: Usuario intenta editar movimiento de otro
 *                 value:
 *                   message: "Forbidden - You can only modify your own movements"
 *                   code: "NOT_OWNER"
 *       404:
 *         description: Movimiento no encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             example:
 *               message: "Movement not found"
 *       405:
 *         description: Método no permitido.
 *   delete:
 *     summary: Eliminar un movimiento
 *     description: Elimina un movimiento existente. Los administradores pueden eliminar cualquier movimiento, los usuarios solo sus propios movimientos.
 *     tags:
 *       - Movements
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del movimiento a eliminar.
 *     responses:
 *       204:
 *         description: Movimiento eliminado correctamente.
 *       400:
 *         description: Identificador de movimiento inválido.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             example:
 *               message: "Invalid movement id"
 *       401:
 *         description: No autenticado.
 *       403:
 *         description: No autorizado para eliminar este movimiento.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 code:
 *                   type: string
 *             examples:
 *               notOwner:
 *                 summary: Usuario intenta eliminar movimiento de otro
 *                 value:
 *                   message: "Forbidden - You can only modify your own movements"
 *                   code: "NOT_OWNER"
 *       404:
 *         description: Movimiento no encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             example:
 *               message: "Movement not found"
 *       405:
 *         description: Método no permitido.
 */

const handlePatch = async (
  movementId: string,
  body: UpdateMovementBody,
  res: NextApiResponse
): Promise<void> => {
  const validation = updateMovementSchema.safeParse(body);

  if (!validation.success) {
    res.status(400).json({
      message: 'Validation error',
      errors: validation.error.flatten().fieldErrors,
    });
    return;
  }

  const { concept, amount, date, type } = validation.data;

  const data: {
    concept?: string;
    amount?: number;
    date?: Date;
    type?: 'INCOME' | 'EXPENSE';
  } = {};

  if (concept !== undefined) {
    data.concept = concept.trim();
  }

  if (amount !== undefined) {
    data.amount = amount;
  }

  if (date !== undefined) {
    data.date = new Date(date);
  }

  if (type !== undefined) {
    data.type = type;
  }

  try {
    const updatedMovement = await prisma.movement.update({
      where: { id: movementId },
      data,
    });

    res.status(200).json(updatedMovement);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('Record to update not found')
    ) {
      res.status(404).json({
        message: 'Movement not found',
        code: 'MOVEMENT_NOT_FOUND',
      });
      return;
    }

    res.status(500).json({
      message: 'Internal server error',
      code: 'DATABASE_ERROR',
    });
  }
};

const handleDelete = async (
  movementId: string,
  res: NextApiResponse
): Promise<void> => {
  try {
    await prisma.movement.delete({
      where: { id: movementId },
    });

    res.status(204).end();
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('Record to delete does not exist')
    ) {
      res.status(404).json({
        message: 'Movement not found',
        code: 'MOVEMENT_NOT_FOUND',
      });
      return;
    }

    res.status(500).json({
      message: 'Internal server error',
      code: 'DATABASE_ERROR',
    });
  }
};

const handler = async (
  req: AuthenticatedRequest,
  res: NextApiResponse
): Promise<void> => {
  const { id } = req.query;
  const movementId = Array.isArray(id) ? id[0] : id;

  if (!movementId || typeof movementId !== 'string') {
    res.status(400).json({ message: 'Invalid movement id' });
    return;
  }

  if (req.method !== 'PATCH' && req.method !== 'DELETE') {
    res.setHeader('Allow', 'PATCH, DELETE');
    res.status(405).end('Method Not Allowed');
    return;
  }

  const movement = await prisma.movement.findUnique({
    where: { id: movementId },
  });

  if (!movement) {
    res.status(404).json({ message: 'Movement not found' });
    return;
  }

  // Verificar rol de admin consultando la base de datos (no confiar solo en la sesión)
  let isAdmin = false;
  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: req.auth.user.id },
      select: { role: true },
    });
    isAdmin = dbUser?.role === 'ADMIN';
  } catch {
    isAdmin = req.auth.user.role === 'ADMIN'; // Fallback a la sesión
  }

  // Verificar permisos: ADMIN puede editar cualquier movimiento, USER solo los propios
  const isOwner = movement.userId === req.auth.user.id;

  if (!isAdmin && !isOwner) {
    res.status(403).json({
      message: 'Forbidden - You can only modify your own movements',
      code: 'NOT_OWNER',
    });
    return;
  }

  if (req.method === 'PATCH') {
    await handlePatch(movementId, req.body, res);
    return;
  }

  // DELETE
  await handleDelete(movementId, res);
};

export default withAuth(handler);
