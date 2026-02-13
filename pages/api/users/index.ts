import type { NextApiResponse } from 'next';
import { prisma } from '@/lib/db';
import { withRole, type AuthenticatedRequest } from '@/lib/auth';

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Listar usuarios
 *     description: Devuelve la lista de usuarios. Solo disponible para administradores.
 *     tags:
 *       - Users
 *     responses:
 *       200:
 *         description: Lista de usuarios.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                     nullable: true
 *                   email:
 *                     type: string
 *                   phone:
 *                     type: string
 *                     nullable: true
 *                   role:
 *                     type: string
 *                     enum: [USER, ADMIN]
 *       401:
 *         description: No autenticado.
 *       403:
 *         description: No autorizado, se requiere rol ADMIN.
 */

const handler = async (
  _req: AuthenticatedRequest,
  res: NextApiResponse
): Promise<void> => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  res.status(200).json(users);
};

export default withRole('ADMIN', handler);
