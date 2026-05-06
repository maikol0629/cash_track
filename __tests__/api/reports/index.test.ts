jest.mock('@/lib/auth', () => ({
  withAuth: (handler: any) => handler,
  withRole: (_roles: any, handler: any) => handler,
}));

const mockPrisma = {
  movement: {
    count: jest.fn(),
    findMany: jest.fn(),
  },
};

jest.mock('@/lib/db', () => ({
  prisma: mockPrisma,
}));

import handler from '@/pages/api/reports';

const createMockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn();
  res.end = jest.fn();
  return res;
};

describe('/api/reports', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns financial aggregates for admins', async () => {
    mockPrisma.movement.count.mockResolvedValueOnce(2);
    mockPrisma.movement.findMany.mockResolvedValueOnce([
      {
        amount: 100,
        type: 'INCOME',
        date: new Date('2025-01-10T00:00:00.000Z'),
      },
      {
        amount: 40,
        type: 'EXPENSE',
        date: new Date('2025-01-15T00:00:00.000Z'),
      },
    ]);

    const req = {
      auth: {
        user: {
          id: 'admin-1',
          role: 'ADMIN',
        },
      },
    } as never;
    const res = createMockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      totalIncome: 100,
      totalExpense: 40,
      balance: 60,
      totalMovements: 2,
      monthly: [
        {
          month: '2025-01',
          income: 100,
          expense: 40,
        },
      ],
    });
  });
});
