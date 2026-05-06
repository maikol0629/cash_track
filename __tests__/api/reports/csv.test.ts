jest.mock('@/lib/auth', () => ({
  withAuth: (handler: any) => handler,
  withRole: (_roles: any, handler: any) => handler,
}));

const mockPrisma = {
  movement: {
    findMany: jest.fn(),
  },
};

jest.mock('@/lib/db', () => ({
  prisma: mockPrisma,
}));

const mockGenerateMovementsCsv = jest.fn(() => 'csv-content');

jest.mock('@/lib/csv', () => ({
  generateMovementsCsv: mockGenerateMovementsCsv,
}));

import handler from '@/pages/api/reports/csv';

const createMockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn();
  res.send = jest.fn().mockReturnValue(res);
  res.end = jest.fn();
  return res;
};

describe('/api/reports/csv', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns a CSV file for admins', async () => {
    mockPrisma.movement.findMany.mockResolvedValueOnce([
      {
        id: 'movement-1',
        concept: 'Salary',
        amount: 1200,
        type: 'INCOME',
        date: new Date('2025-01-15T00:00:00.000Z'),
        user: {
          name: 'Jane',
          email: 'jane@example.com',
        },
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

    expect(mockGenerateMovementsCsv).toHaveBeenCalledWith([
      expect.objectContaining({ concept: 'Salary' }),
    ]);
    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'text/csv; charset=utf-8'
    );
    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Disposition',
      'attachment; filename="movements-report.csv"'
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith('csv-content');
  });
});
