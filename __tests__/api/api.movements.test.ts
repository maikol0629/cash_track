import type { NextApiRequest } from 'next';
import { createMockRes, prismaMock } from '../test-utils/api';
import handler from '@/pages/api/movements';
import byIdHandler from '@/pages/api/movements/[id]';

describe('GET /api/movements RBAC', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 for unauthenticated user', async () => {
    const req = {
      method: 'GET',
      query: {},
      // no auth
    } as unknown as NextApiRequest;

    const res = createMockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
    expect(prismaMock.movement.findMany).not.toHaveBeenCalled();
    expect(prismaMock.movement.count).not.toHaveBeenCalled();
  });

  it('USER role sees only their own movements and filters by userId', async () => {
    const req = {
      method: 'GET',
      query: {},
      auth: {
        user: { id: 'user-1', role: 'USER' },
      },
    } as unknown as NextApiRequest;

    const movements = [
      {
        id: 'm1',
        concept: 'Own movement',
        amount: 100,
        type: 'INCOME',
        date: new Date('2025-01-01').toISOString(),
        userId: 'user-1',
        user: {
          id: 'user-1',
          name: 'User One',
          email: 'user1@example.com',
          phone: null,
          role: 'USER',
        },
      },
    ];

    prismaMock.movement.count.mockResolvedValueOnce(movements.length);
    prismaMock.movement.findMany.mockResolvedValueOnce(movements);

    const res = createMockRes();

    await handler(req, res);

    expect(prismaMock.movement.count).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
    });

    expect(prismaMock.movement.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-1' } })
    );

    expect(res.status).toHaveBeenCalledWith(200);
    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.data).toHaveLength(1);
    expect(body.data[0].userId).toBe('user-1');
  });

  it('ADMIN role sees all movements from all users', async () => {
    const req = {
      method: 'GET',
      query: {},
      auth: {
        user: { id: 'admin-1', role: 'ADMIN' },
      },
    } as unknown as NextApiRequest;

    const movements = [
      {
        id: 'm1',
        concept: 'Admin movement',
        amount: 100,
        type: 'INCOME',
        date: new Date('2025-01-01').toISOString(),
        userId: 'admin-1',
        user: {
          id: 'admin-1',
          name: 'Admin',
          email: 'admin@example.com',
          phone: null,
          role: 'ADMIN',
        },
      },
      {
        id: 'm2',
        concept: 'User movement',
        amount: 50,
        type: 'EXPENSE',
        date: new Date('2025-01-02').toISOString(),
        userId: 'user-2',
        user: {
          id: 'user-2',
          name: 'User Two',
          email: 'user2@example.com',
          phone: null,
          role: 'USER',
        },
      },
    ];

    prismaMock.movement.count.mockResolvedValueOnce(movements.length);
    prismaMock.movement.findMany.mockResolvedValueOnce(movements);

    const res = createMockRes();

    await handler(req, res);

    expect(prismaMock.movement.count).toHaveBeenCalledWith({ where: undefined });
    expect(prismaMock.movement.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: undefined })
    );

    expect(res.status).toHaveBeenCalledWith(200);
    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.data).toHaveLength(2);
  });

  it('returns empty array when user has no movements', async () => {
    const req = {
      method: 'GET',
      query: {},
      auth: {
        user: { id: 'user-empty', role: 'USER' },
      },
    } as unknown as NextApiRequest;

    prismaMock.movement.count.mockResolvedValueOnce(0);
    prismaMock.movement.findMany.mockResolvedValueOnce([]);

    const res = createMockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.data).toEqual([]);
    expect(body.pagination.total).toBe(0);
  });
});

describe('POST /api/movements RBAC and validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 for unauthenticated user', async () => {
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

    const res = createMockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
    expect(prismaMock.movement.create).not.toHaveBeenCalled();
  });

  it('returns 403 when USER (non-admin) tries to create a movement', async () => {
    const req = {
      method: 'POST',
      body: {
        concept: 'User movement',
        amount: 100,
        date: '2025-01-01T00:00:00.000Z',
        type: 'INCOME',
      },
      auth: {
        user: { id: 'user-1', role: 'USER' },
      },
    } as unknown as NextApiRequest;

    const res = createMockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Forbidden' });
    expect(prismaMock.movement.create).not.toHaveBeenCalled();
  });

  it('ADMIN user successfully creates a movement associated to themselves', async () => {
    const req = {
      method: 'POST',
      body: {
        concept: 'Admin salary',
        amount: 1500,
        date: '2025-01-01T00:00:00.000Z',
        type: 'INCOME',
      },
      auth: {
        user: { id: 'admin-1', role: 'ADMIN' },
      },
    } as unknown as NextApiRequest;

    const created = {
      id: 'movement-1',
      concept: 'Admin salary',
      amount: 1500,
      date: new Date('2025-01-01T00:00:00.000Z'),
      type: 'INCOME',
      userId: 'admin-1',
    };

    prismaMock.movement.create.mockResolvedValueOnce(created);

    const res = createMockRes();

    await handler(req, res);

    expect(prismaMock.movement.create).toHaveBeenCalledWith({
      data: {
        concept: 'Admin salary',
        amount: 1500,
        type: 'INCOME',
        date: new Date('2025-01-01T00:00:00.000Z'),
        userId: 'admin-1',
      },
    });

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(created);
  });

  it('validates required fields: concept, amount, date, type', async () => {
    const baseReq = {
      method: 'POST',
      auth: {
        user: { id: 'admin-1', role: 'ADMIN' },
      },
    } as unknown as NextApiRequest;

    const res1 = createMockRes();
    await handler(
      {
        ...baseReq,
        body: {
          concept: '',
          amount: 100,
          date: '2025-01-01T00:00:00.000Z',
          type: 'INCOME',
        },
      } as NextApiRequest,
      res1
    );
    expect(res1.status).toHaveBeenCalledWith(400);

    const res2 = createMockRes();
    await handler(
      {
        ...baseReq,
        body: {
          concept: 'Test',
          amount: undefined,
          date: '2025-01-01T00:00:00.000Z',
          type: 'INCOME',
        },
      } as NextApiRequest,
      res2
    );
    expect(res2.status).toHaveBeenCalledWith(400);

    const res3 = createMockRes();
    await handler(
      {
        ...baseReq,
        body: {
          concept: 'Test',
          amount: 100,
          date: 'not-a-date',
          type: 'INCOME',
        },
      } as NextApiRequest,
      res3
    );
    expect(res3.status).toHaveBeenCalledWith(400);

    const res4 = createMockRes();
    await handler(
      {
        ...baseReq,
        body: {
          concept: 'Test',
          amount: 100,
          date: '2025-01-01T00:00:00.000Z',
          type: 'OTHER',
        },
      } as NextApiRequest,
      res4
    );
    expect(res4.status).toHaveBeenCalledWith(400);

    expect(prismaMock.movement.create).not.toHaveBeenCalled();
  });

  it('rejects invalid amount: zero, negative, or non-numeric', async () => {
    const baseReq = {
      method: 'POST',
      auth: {
        user: { id: 'admin-1', role: 'ADMIN' },
      },
    } as unknown as NextApiRequest;

    const commonBody = {
      concept: 'Test',
      date: '2025-01-01T00:00:00.000Z',
      type: 'INCOME',
    };

    const resZero = createMockRes();
    await handler(
      {
        ...baseReq,
        body: { ...commonBody, amount: 0 },
      } as NextApiRequest,
      resZero
    );
    expect(resZero.status).toHaveBeenCalledWith(400);

    const resNegative = createMockRes();
    await handler(
      {
        ...baseReq,
        body: { ...commonBody, amount: -10 },
      } as NextApiRequest,
      resNegative
    );
    expect(resNegative.status).toHaveBeenCalledWith(400);

    const resNonNumeric = createMockRes();
    await handler(
      {
        ...baseReq,
        body: { ...commonBody, amount: 'abc' },
      } as NextApiRequest,
      resNonNumeric
    );
    expect(resNonNumeric.status).toHaveBeenCalledWith(400);

    expect(prismaMock.movement.create).not.toHaveBeenCalled();
  });

  it("rejects invalid type when it's not INCOME or EXPENSE", async () => {
    const req = {
      method: 'POST',
      body: {
        concept: 'Test',
        amount: 100,
        date: '2025-01-01T00:00:00.000Z',
        type: 'income', // lowercase invalid according to API
      },
      auth: {
        user: { id: 'admin-1', role: 'ADMIN' },
      },
    } as unknown as NextApiRequest;

    const res = createMockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Type must be INCOME or EXPENSE',
    });
    expect(prismaMock.movement.create).not.toHaveBeenCalled();
  });
});

describe('PATCH/DELETE /api/movements/[id] RBAC and behavior', () => {
  const baseMovement = {
    id: 'movement-1',
    concept: 'Original',
    amount: 100,
    date: new Date('2025-01-01T00:00:00.000Z'),
    type: 'INCOME',
    userId: 'owner-1',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when unauthenticated (handled by withAuth wrapper)', async () => {
    const req = {
      method: 'PATCH',
      query: { id: baseMovement.id },
      body: { concept: 'Updated' },
      // no auth
    } as unknown as NextApiRequest;

    const res = createMockRes();

    await byIdHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
    expect(prismaMock.movement.findUnique).not.toHaveBeenCalled();
  });

  it('returns 404 when movement does not exist', async () => {
    const req = {
      method: 'PATCH',
      query: { id: 'missing-id' },
      body: { concept: 'Updated' },
      auth: {
        user: { id: 'admin-1', role: 'ADMIN' },
      },
    } as unknown as NextApiRequest;

    prismaMock.movement.findUnique.mockResolvedValueOnce(null);

    const res = createMockRes();

    await byIdHandler(req, res);

    expect(prismaMock.movement.findUnique).toHaveBeenCalledWith({
      where: { id: 'missing-id' },
    });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Movement not found' });
  });

  it('returns 403 when authenticated user is neither owner nor ADMIN', async () => {
    const req = {
      method: 'PATCH',
      query: { id: baseMovement.id },
      body: { concept: 'Updated' },
      auth: {
        user: { id: 'another-user', role: 'USER' },
      },
    } as unknown as NextApiRequest;

    prismaMock.movement.findUnique.mockResolvedValueOnce(baseMovement);

    const res = createMockRes();

    await byIdHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Forbidden' });
    expect(prismaMock.movement.update).not.toHaveBeenCalled();
  });

  it('allows OWNER to PATCH their movement', async () => {
    const req = {
      method: 'PATCH',
      query: { id: baseMovement.id },
      body: { concept: 'Updated concept' },
      auth: {
        user: { id: 'owner-1', role: 'USER' },
      },
    } as unknown as NextApiRequest;

    prismaMock.movement.findUnique.mockResolvedValueOnce(baseMovement);

    const updated = {
      ...baseMovement,
      concept: 'Updated concept',
    };
    prismaMock.movement.update.mockResolvedValueOnce(updated);

    const res = createMockRes();

    await byIdHandler(req, res);

    expect(prismaMock.movement.update).toHaveBeenCalledWith({
      where: { id: baseMovement.id },
      data: { concept: 'Updated concept' },
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(updated);
  });

  it('ADMIN can PATCH movements of any user', async () => {
    const req = {
      method: 'PATCH',
      query: { id: baseMovement.id },
      body: { amount: 200 },
      auth: {
        user: { id: 'admin-1', role: 'ADMIN' },
      },
    } as unknown as NextApiRequest;

    prismaMock.movement.findUnique.mockResolvedValueOnce(baseMovement);

    const updated = {
      ...baseMovement,
      amount: 200,
    };
    prismaMock.movement.update.mockResolvedValueOnce(updated);

    const res = createMockRes();

    await byIdHandler(req, res);

    expect(prismaMock.movement.update).toHaveBeenCalledWith({
      where: { id: baseMovement.id },
      data: { amount: 200 },
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(updated);
  });

  it('validates PATCH payload and rejects invalid amount', async () => {
    const req = {
      method: 'PATCH',
      query: { id: baseMovement.id },
      body: { amount: 'not-a-number' },
      auth: {
        user: { id: 'admin-1', role: 'ADMIN' },
      },
    } as unknown as NextApiRequest;

    prismaMock.movement.findUnique.mockResolvedValueOnce(baseMovement);

    const res = createMockRes();

    await byIdHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Amount must be a valid number',
    });
    expect(prismaMock.movement.update).not.toHaveBeenCalled();
  });

  it('OWNER can DELETE their movement', async () => {
    const req = {
      method: 'DELETE',
      query: { id: baseMovement.id },
      auth: {
        user: { id: 'owner-1', role: 'USER' },
      },
    } as unknown as NextApiRequest;

    prismaMock.movement.findUnique.mockResolvedValueOnce(baseMovement);

    const res = createMockRes();

    await byIdHandler(req, res);

    expect(prismaMock.movement.delete).toHaveBeenCalledWith({
      where: { id: baseMovement.id },
    });
    expect(res.status).toHaveBeenCalledWith(204);
  });

  it('ADMIN can DELETE any movement', async () => {
    const req = {
      method: 'DELETE',
      query: { id: baseMovement.id },
      auth: {
        user: { id: 'admin-1', role: 'ADMIN' },
      },
    } as unknown as NextApiRequest;

    prismaMock.movement.findUnique.mockResolvedValueOnce(baseMovement);

    const res = createMockRes();

    await byIdHandler(req, res);

    expect(prismaMock.movement.delete).toHaveBeenCalledWith({
      where: { id: baseMovement.id },
    });
    expect(res.status).toHaveBeenCalledWith(204);
  });
});
