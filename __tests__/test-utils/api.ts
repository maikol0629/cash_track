import type { NextApiResponse } from 'next';

// Central Prisma mock used across API tests
export const prismaMock = {
  user: {
    findMany: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    delete: jest.fn(),
    findUnique: jest.fn(),
  },
  movement: {
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findUnique: jest.fn(),
  },
};

jest.mock('@/lib/db', () => ({
  prisma: prismaMock,
}));

jest.mock('@/lib/auth', () => {
  const withAuth = (innerHandler: any) => (req: any, res: any) => {
    if (!req.auth || !req.auth.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    return innerHandler(req, res);
  };

  const withRole = (roles: string[] | string, innerHandler: any) => {
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    return (req: any, res: any) => {
      if (!req.auth || !req.auth.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      if (!allowedRoles.includes(req.auth.user.role)) {
        res.status(403).json({ message: 'Forbidden' });
        return;
      }

      return innerHandler(req, res);
    };
  };

  return { withAuth, withRole };
});

// Shared helper to build a mock NextApiResponse
export const createMockRes = () => {
  const res: Partial<NextApiResponse> = {};
  res.status = jest.fn().mockReturnValue(res as NextApiResponse);
  res.json = jest.fn().mockReturnValue(res as NextApiResponse);
  res.setHeader = jest.fn();
  res.end = jest.fn();
  return res as NextApiResponse;
};
