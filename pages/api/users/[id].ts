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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                   nullable: true
 *                 email:
 *                   type: string
 *                   format: email
 *                 phone:
 *                   type: string
 *                   nullable: true
 *                 role:
 *                   type: string
 *                   enum: [USER, ADMIN]
 *             example:
 *               id: "user_123"
 *               name: "Juan Pérez"
 *               email: "juan@example.com"
 *               phone: "+57 3001234567"
 *               role: "ADMIN"
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
 *         description: No autorizado, se requiere rol ADMIN.
 *       405:
 *         description: Método no permitido.
 *   delete:
 *     summary: Eliminar un usuario
 *     description: Elimina un usuario. No permite eliminar al último usuario con rol ADMIN.
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario a eliminar.
 *     responses:
 *       204:
 *         description: Usuario eliminado correctamente.
 *       400:
 *         description: No se puede eliminar al último administrador o identificador inválido.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             examples:
 *               lastAdmin:
 *                 summary: Último administrador
 *                 value:
 *                   message: "Cannot delete the last admin user"
 *               invalidId:
 *                 summary: ID inválido
 *                 value:
 *                   message: "Invalid user id"
 *       401:
 *         description: No autenticado.
 *       403:
 *         description: No autorizado, se requiere rol ADMIN.
 *       404:
 *         description: Usuario no encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             example:
 *               message: "User not found"
 *       405:
 *         description: Método no permitido.
 */

const handler = async (
  req: AuthenticatedRequest,
  res: NextApiResponse
): Promise<void> => {
  const { id } = req.query;
  const userId = Array.isArray(id) ? id[0] : id;

  if (!userId || typeof userId !== 'string') {
    res.status(400).json({ message: 'Invalid user id' });
    return;
  }

  if (req.method === 'PATCH') {
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

    try {
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
    } catch {
      res.status(404).json({ message: 'User not found' });
    }
    return;
  }

  if (req.method === 'DELETE') {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    if (user.role === 'ADMIN') {
      const adminCount = await prisma.user.count({
        where: { role: 'ADMIN' },
      });

      if (adminCount <= 1) {
        res.status(400).json({ message: 'Cannot delete the last admin user' });
        return;
      }
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    res.status(204).end();
    return;
  }

  res.setHeader('Allow', 'PATCH, DELETE');
  res.status(405).end('Method Not Allowed');
};

export default withRole('ADMIN', handler);
