import type { NextApiRequest, NextApiResponse } from 'next';
import handler from '@/pages/api/movements';

// Se mockea Prisma para no tocar la base de datos real durante las pruebas
jest.mock('@/lib/db', () => ({
  prisma: {
    movement: {
      create: jest.fn(),
    },
  },
}));
// Se mockea withAuth para simular la autenticación y poder probar la lógica del handler
jest.mock('@/lib/auth', () => ({
  withAuth:
    (innerHandler: any) =>
    (req: any, res: any) => {
      if (!req.auth || !req.auth.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
      return innerHandler(req, res);
    },
}));

// Crea un objeto NextApiResponse simulado para inspeccionar status y json
const mockRes = () => {
  const res: Partial<NextApiResponse> = {};
  res.status = jest.fn().mockReturnValue(res as NextApiResponse);
  res.json = jest.fn().mockReturnValue(res as NextApiResponse);
  res.setHeader = jest.fn();
  res.end = jest.fn();
  return res as NextApiResponse;
};

const prismaMock = require('@/lib/db').prisma;

describe('POST /api/movements', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a movement successfully', async () => {
    const req = {
      method: 'POST',
      body: {
        concept: 'Salary',
        amount: 1000,
        date: '2025-01-01T00:00:00.000Z',
        type: 'INCOME',
      },
      auth: {
        user: { id: 'user-1', role: 'ADMIN' },
      },
    } as unknown as NextApiRequest;

    const movement = {
      id: 'movement-1',
      concept: 'Salary',
      amount: 1000,
      date: new Date('2025-01-01T00:00:00.000Z'),
      type: 'INCOME',
      userId: 'user-1',
    };

    prismaMock.movement.create.mockResolvedValueOnce(movement);

    const res = mockRes();

    await handler(req, res);

    expect(prismaMock.movement.create).toHaveBeenCalledWith({
      data: {
        concept: 'Salary',
        amount: 1000,
        type: 'INCOME',
        date: new Date('2025-01-01T00:00:00.000Z'),
        userId: 'user-1',
      },
    });

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(movement);
  });

  it('returns 400 on validation error (missing concept)', async () => {
    const req = {
      method: 'POST',
      body: {
        concept: '',
        amount: 1000,
        date: '2025-01-01T00:00:00.000Z',
        type: 'INCOME',
      },
      auth: {
        user: { id: 'user-1', role: 'ADMIN' },
      },
    } as unknown as NextApiRequest;

    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Concept is required' });
    expect(prismaMock.movement.create).not.toHaveBeenCalled();
  });

  it('requires authentication', async () => {
    const req = {
      method: 'POST',
      body: {
        concept: 'Salary',
        amount: 1000,
        date: '2025-01-01T00:00:00.000Z',
        type: 'INCOME',
      },
      // no auth
    } as unknown as NextApiRequest;

    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
    expect(prismaMock.movement.create).not.toHaveBeenCalled();
  });
});
