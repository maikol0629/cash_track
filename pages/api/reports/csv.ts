import type { NextApiResponse } from 'next';
import { prisma } from '@/lib/db';
import { withRole, type AuthenticatedRequest } from '@/lib/auth';
import { generateMovementsCsv } from '@/lib/csv';

const handler = async (
  _req: AuthenticatedRequest,
  res: NextApiResponse
): Promise<void> => {
  const movements = await prisma.movement.findMany({
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: { date: 'asc' },
  });

  const csvContent = generateMovementsCsv(movements);

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader(
    'Content-Disposition',
    'attachment; filename="movements-report.csv"'
  );

  res.status(200).send(csvContent);
};

export default withRole('ADMIN', handler);
