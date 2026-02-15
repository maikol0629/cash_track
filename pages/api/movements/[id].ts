import type { NextApiResponse } from 'next';
import { prisma } from '@/lib/db';
import { withAuth, type AuthenticatedRequest } from '@/lib/auth';

interface UpdateMovementBody {
  concept?: unknown;
  amount?: unknown;
  date?: unknown;
  type?: unknown;
}

/**
 * @swagger
 * /api/movements/{id}:
 *   patch:
 *     summary: Actualizar un movimiento
 *     description: Actualiza los campos de un movimiento existente (concepto, monto, fecha y tipo).
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
 *             example:
 *               message: "Forbidden"
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
 *     description: Elimina un movimiento existente. Solo el propietario o un administrador pueden eliminarlo.
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
 *             example:
 *               message: "Forbidden"
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

const parseNumber = (value: unknown): number | null => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const parseDate = (value: unknown): Date | null => {
  if (typeof value !== 'string') return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
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

  const isAdmin = req.auth.user.role === 'ADMIN';
  const isOwner = movement.userId === req.auth.user.id;

  if (!isAdmin && !isOwner) {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }

  if (req.method === 'PATCH') {
    const { concept, amount, date, type } = req.body as UpdateMovementBody;

    const data: {
      concept?: string;
      amount?: number;
      date?: Date;
      type?: 'INCOME' | 'EXPENSE';
    } = {};

    if (concept !== undefined) {
      if (typeof concept !== 'string' || concept.trim().length === 0) {
        res.status(400).json({ message: 'Concept must be a non-empty string' });
        return;
      }
      data.concept = concept.trim();
    }

    if (amount !== undefined) {
      const numericAmount = parseNumber(amount);
      if (numericAmount === null) {
        res.status(400).json({ message: 'Amount must be a valid number' });
        return;
      }
      data.amount = numericAmount;
    }

    if (date !== undefined) {
      const parsedDate = parseDate(date);
      if (!parsedDate) {
        res.status(400).json({ message: 'Date must be a valid ISO string' });
        return;
      }
      data.date = parsedDate;
    }

    if (type !== undefined) {
      if (type === 'INCOME' || type === 'EXPENSE') {
        data.type = type;
      } else {
        res.status(400).json({ message: 'Type must be INCOME or EXPENSE' });
        return;
      }
    }

    if (Object.keys(data).length === 0) {
      res.status(400).json({ message: 'No valid fields to update' });
      return;
    }

    const updatedMovement = await prisma.movement.update({
      where: { id: movementId },
      data,
    });

    res.status(200).json(updatedMovement);
    return;
  }

  // DELETE
  await prisma.movement.delete({
    where: { id: movementId },
  });

  res.status(204).end();
};

export default withAuth(handler);
