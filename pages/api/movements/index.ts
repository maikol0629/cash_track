import type { NextApiResponse } from 'next';
import { prisma } from '@/lib/db';
import { withAuth, type AuthenticatedRequest } from '@/lib/auth';

interface TransactionsQuery {
  page?: string | string[];
  limit?: string | string[];
}

interface CreateTransactionBody {
  concept?: unknown;
  amount?: unknown;
  date?: unknown;
  type?: unknown;
}

/**
 * @swagger
 * /api/movements:
 *   get:
 *     summary: Listar movimientos financieros
 *     description: Devuelve una lista paginada de movimientos (ingresos y egresos).
 *     tags:
 *       - Movements
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página para la paginación.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Cantidad de elementos por página.
 *     responses:
 *       200:
 *         description: Lista paginada de movimientos.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       concept:
 *                         type: string
 *                       amount:
 *                         type: number
 *                       type:
 *                         type: string
 *                         enum: [INCOME, EXPENSE]
 *                       date:
 *                         type: string
 *                         format: date-time
 *                       userId:
 *                         type: string
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       401:
 *         description: No autenticado.
 *   post:
 *     summary: Crear un nuevo movimiento
 *     description: Crea un nuevo ingreso o egreso asociado al usuario autenticado.
 *     tags:
 *       - Movements
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - concept
 *               - amount
 *               - date
 *               - type
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
 *             concept: "Pago de salario"
 *             amount: 1500.5
 *             date: "2025-01-15T00:00:00.000Z"
 *             type: "INCOME"
 *     responses:
 *       201:
 *         description: Movimiento creado correctamente.
 *       400:
 *         description: Datos inválidos en la solicitud.
 *       401:
 *         description: No autenticado.
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
  if (req.method === 'GET') {
    const { page = '1', limit = '10' } = req.query as TransactionsQuery;

    const pageNumber = Number(Array.isArray(page) ? page[0] : page) || 1;
    const pageSize = Number(Array.isArray(limit) ? limit[0] : limit) || 10;

    const skip = (pageNumber - 1) * pageSize;

    const isAdmin = req.auth.user.role === 'ADMIN';

    const where = isAdmin ? undefined : { userId: req.auth.user.id };

    const [total, movements] = await Promise.all([
      prisma.movement.count({ where }),
      prisma.movement.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              role: true,
            },
          },
        },
        orderBy: { date: 'desc' },
        skip,
        take: pageSize,
      }),
    ]);

    res.status(200).json({
      data: movements,
      pagination: {
        page: pageNumber,
        limit: pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
    return;
  }

  if (req.method === 'POST') {
    const { concept, amount, date, type } = req.body as CreateTransactionBody;

    if (typeof concept !== 'string' || concept.trim().length === 0) {
      res.status(400).json({ message: 'Concept is required' });
      return;
    }

    if (req.auth.user.role !== 'ADMIN') {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    const numericAmount = parseNumber(amount);
    if (numericAmount === null) {
      res.status(400).json({ message: 'Amount must be a valid number' });
      return;
    }

    if (numericAmount <= 0) {
      res.status(400).json({ message: 'Amount must be greater than 0' });
      return;
    }

    const parsedDate = parseDate(date);
    if (!parsedDate) {
      res.status(400).json({ message: 'Date must be a valid ISO string' });
      return;
    }

    const movementTypeValue =
      typeof type === 'string' && (type === 'INCOME' || type === 'EXPENSE')
        ? (type as 'INCOME' | 'EXPENSE')
        : null;

    if (!movementTypeValue) {
      res.status(400).json({ message: 'Type must be INCOME or EXPENSE' });
      return;
    }

    const movement = await prisma.movement.create({
      data: {
        concept: concept.trim(),
        amount: numericAmount,
        type: movementTypeValue,
        date: parsedDate,
        userId: req.auth.user.id,
      },
    });

    res.status(201).json(movement);
    return;
  }

  res.setHeader('Allow', 'GET, POST');
  res.status(405).end('Method Not Allowed');
};

export default withAuth(handler);
