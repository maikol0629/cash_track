import type { NextApiResponse } from 'next';
import { prisma } from '@/lib/db';
import { withRole, type AuthenticatedRequest, type Role } from '@/lib/auth';

interface UpdateUserBody {
  name?: unknown;
  role?: unknown;
}

/**
 * @swagger
 * /api/users/{id}:
 *   patch:
 *     summary: Actualizar un usuario
 *     description: Actualiza el nombre y/o el rol de un usuario. Solo disponible para administradores.
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario a actualizar.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [USER, ADMIN]
 *           example:
 *             name: "Juan Pérez"
 *             role: "ADMIN"
 *     responses:
 *       200:
 *         description: Usuario actualizado correctamente.
 *       400:
 *         description: Datos inválidos o sin campos a actualizar.
 *       401:
 *         description: No autenticado.
 *       403:
 *         description: No autorizado, se requiere rol ADMIN.
 *       405:
 *         description: Método no permitido.
 */

const handler = async (
  req: AuthenticatedRequest,
  res: NextApiResponse
): Promise<void> => {
  if (req.method !== 'PATCH') {
    res.setHeader('Allow', 'PATCH');
    res.status(405).end('Method Not Allowed');
    return;
  }

  const { id } = req.query;
  const userId = Array.isArray(id) ? id[0] : id;

  if (!userId || typeof userId !== 'string') {
    res.status(400).json({ message: 'Invalid user id' });
    return;
  }

  const { name, role } = req.body as UpdateUserBody;

  const data: { name?: string | null; role?: Role } = {};

  if (typeof name === 'string') {
    data.name = name.trim();
  }

  if (role !== undefined) {
    if (role === 'USER' || role === 'ADMIN') {
      data.role = role as Role;
    } else {
      res.status(400).json({ message: 'Invalid role value' });
      return;
    }
  }

  if (Object.keys(data).length === 0) {
    res.status(400).json({ message: 'No valid fields to update' });
    return;
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
    },
  });

  res.status(200).json(updatedUser);
};

export default withRole('ADMIN', handler);
