jest.mock('@/lib/auth', () => ({
  withAuth: (handler: any) => handler,
  withRole: (_roles: any, handler: any) => handler,
}));

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
  },
};

jest.mock('@/lib/db', () => ({
  prisma: mockPrisma,
}));

import handler from '@/pages/api/me';

const createMockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn();
  res.end = jest.fn();
  return res;
};

describe('/api/me', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the authenticated user when it exists', async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: 'user-1',
      name: 'Jane',
      email: 'jane@example.com',
      phone: null,
      role: 'ADMIN',
      image: null,
    });

    const req = {
      auth: {
        user: {
          id: 'user-1',
        },
      },
    } as never;
    const res = createMockRes();

    await handler(req, res);

    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        image: true,
      },
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      id: 'user-1',
      name: 'Jane',
      email: 'jane@example.com',
      phone: null,
      role: 'ADMIN',
      image: null,
    });
  });

  it('returns a not found response when the user is missing', async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce(null);

    const req = {
      auth: {
        user: {
          id: 'missing-user',
        },
      },
    } as never;
    const res = createMockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
  });
});
