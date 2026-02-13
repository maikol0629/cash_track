import type { NextApiResponse } from 'next';
import { prisma } from '@/lib/db';
import { withAuth, type AuthenticatedRequest } from '@/lib/auth';

/**
 * @swagger
 * /api/me:
 *   get:
 *     summary: Obtener el usuario autenticado
 *     description: Devuelve la información del usuario asociado al token de sesión actual.
 *     tags:
 *       - Auth
 *     responses:
 *       200:
 *         description: Información del usuario autenticado.
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
 *                 image:
 *                   type: string
 *                   nullable: true
 *       401:
 *         description: No autenticado. Es necesario iniciar sesión.
 *       404:
 *         description: El usuario autenticado no existe en la base de datos.
 */

const handler = async (
  req: AuthenticatedRequest,
  res: NextApiResponse
): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: req.auth.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      image: true,
    },
  });

  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  res.status(200).json(user);
};

export default withAuth(handler);
