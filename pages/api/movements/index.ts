import type { NextApiResponse } from 'next';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { withAuth, withRole, type AuthenticatedRequest } from '@/lib/auth';

interface TransactionsQuery {
  page?: string | string[];
  limit?: string | string[];
}

// Schema de validación Zod para crear movimientos
const createMovementSchema = z.object({
  concept: z
    .string()
    .min(1, 'Concept is required')
    .max(200, 'Concept too long')
    .transform((val) => val.trim())
    .refine((val) => !/[<>]/.test(val), {
      message: 'Concept cannot contain HTML tags',
    }),
  amount: z
    .number()
    .positive('Amount must be positive')
    .max(999999999, 'Amount exceeds maximum allowed value')
    .refine((val) => Number.isSafeInteger(val * 100), {
      message: 'Amount must be a valid monetary value',
    }),
  date: z.string().refine((val) => !Number.isNaN(Date.parse(val)), {
    message: 'Invalid date format',
  }),
  type: z.enum(['INCOME', 'EXPENSE'], {
    message: 'Type must be INCOME or EXPENSE',
  }),
});

/**
 * @swagger
 * /api/movements:
 *   get:
 *     summary: Listar movimientos financieros
 *     description: Devuelve una lista paginada de movimientos (ingresos y egresos). Los administradores ven todos los movimientos, los usuarios solo los propios.
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
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                       user:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *                             nullable: true
 *                           email:
 *                             type: string
 *                             format: email
 *                           phone:
 *                             type: string
 *                             nullable: true
 *                           role:
 *                             type: string
 *                             enum: [USER, ADMIN]
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
 *       500:
 *         description: Error interno del servidor.
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
 *       400:
 *         description: Datos inválidos en la solicitud.
 *       401:
 *         description: No autenticado.
 *       403:
 *         description: No autorizado, se requiere rol ADMIN.
 *       500:
 *         description: Error interno del servidor.
 */

const getHandler = async (
  req: AuthenticatedRequest,
  res: NextApiResponse
): Promise<void> => {
  if (req.method === 'GET') {
    const { page = '1', limit = '10' } = req.query as TransactionsQuery;

    const pageNumber = Math.max(
      1,
      Number(Array.isArray(page) ? page[0] : page) || 1
    );
    const requestedPageSize =
      Number(Array.isArray(limit) ? limit[0] : limit) || 10;
    const pageSize = Math.min(100, Math.max(1, requestedPageSize)); // Max 100 items per page

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

  res.setHeader('Allow', 'GET, POST');
  res.status(405).end('Method Not Allowed');
};

const postHandler = async (
  req: AuthenticatedRequest,
  res: NextApiResponse
): Promise<void> => {
  // Validar con Zod
  const validation = createMovementSchema.safeParse(req.body);

  if (!validation.success) {
    res.status(400).json({
      message: 'Validation error',
      errors: validation.error.issues,
    });
    return;
  }

  const { concept, amount, date, type } = validation.data;

  try {
    const movement = await prisma.movement.create({
      data: {
        concept: concept.trim(),
        amount,
        type,
        date: new Date(date),
        userId: req.auth.user.id,
      },
    });

    res.status(201).json(movement);
  } catch {
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
  if (req.method === 'GET') {
    return getHandler(req, res);
  }

  if (req.method === 'POST') {
    await withRole('ADMIN', postHandler)(req, res);
    return;
  }

  res.setHeader('Allow', 'GET, POST');
  res.status(405).end('Method Not Allowed');
};

export default withAuth(handler);
