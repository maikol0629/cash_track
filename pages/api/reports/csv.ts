import type { NextApiResponse } from 'next';
import { prisma } from '@/lib/db';
import { withRole, type AuthenticatedRequest } from '@/lib/auth';

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

  const header = ['concept', 'amount', 'date', 'type', 'username'];

  const rows = movements.map(
    (movement: {
      concept: string;
      amount: unknown;
      date: Date;
      type: 'INCOME' | 'EXPENSE';
      user: { name: string | null; email: string } | null;
    }) => {
      const concept = movement.concept.replace(/"/g, '""');
      const amount = Number(movement.amount).toString();
      const date = movement.date.toISOString();
      const type = movement.type;
      const username =
        movement.user?.name ?? movement.user?.email ?? 'Unknown User';

      return [concept, amount, date, type, username]
        .map((value) => `"${value}"`)
        .join(',');
    }
  );

  const csvContent = [header.join(','), ...rows].join('\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader(
    'Content-Disposition',
    'attachment; filename="transactions-report.csv"'
  );

  res.status(200).send(csvContent);
};

export default withRole('ADMIN', handler);
