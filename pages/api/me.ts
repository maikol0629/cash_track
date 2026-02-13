import type { NextApiResponse } from 'next';
import { prisma } from '@/lib/db';
import { withAuth, type AuthenticatedRequest } from '@/lib/auth';

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
