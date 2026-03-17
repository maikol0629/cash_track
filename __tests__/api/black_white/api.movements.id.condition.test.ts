import type { NextApiRequest } from 'next';
import { createMockRes, prismaMock } from '../../test-utils/api';
import byIdHandler from '@/pages/api/movements/[id]';

describe('White-box: condition coverage for /api/movements/[id]', () => {
  const baseMovement = {
    id: 'movement-1',
    concept: 'Original concept',
    amount: 100,
    date: new Date('2025-01-01T00:00:00.000Z'),
    type: 'INCOME' as const,
    userId: 'owner-1',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 400 when id is missing (condition: !movementId)', async () => {
    const req = {
      method: 'PATCH',
      query: {},
      body: { concept: 'Updated' },
      auth: {
        user: { id: 'owner-1', role: 'USER' },
      },
    } as unknown as NextApiRequest;

    const res = createMockRes();

    await byIdHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid movement id' });
  });

  it('returns 400 when id type is invalid (condition: typeof movementId !== string)', async () => {
    const req = {
      method: 'PATCH',
      query: { id: 123 as unknown as string },
      body: { concept: 'Updated' },
      auth: {
        user: { id: 'owner-1', role: 'USER' },
      },
    } as unknown as NextApiRequest;

    const res = createMockRes();

    await byIdHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid movement id' });
  });

  it('returns 405 for unsupported method (condition: method is neither PATCH nor DELETE)', async () => {
    const req = {
      method: 'GET',
      query: { id: 'movement-1' },
      auth: {
        user: { id: 'owner-1', role: 'USER' },
      },
    } as unknown as NextApiRequest;

    const res = createMockRes();

    await byIdHandler(req, res);

    expect(res.setHeader).toHaveBeenCalledWith('Allow', 'PATCH, DELETE');
    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.end).toHaveBeenCalledWith('Method Not Allowed');
  });

  it('uses session fallback and allows PATCH when DB role lookup fails but session is ADMIN', async () => {
    const req = {
      method: 'PATCH',
      query: { id: baseMovement.id },
      body: { amount: 200 },
      auth: {
        user: { id: 'admin-1', role: 'ADMIN' },
      },
    } as unknown as NextApiRequest;

    prismaMock.movement.findUnique.mockResolvedValueOnce(baseMovement);
    prismaMock.user.findUnique.mockRejectedValueOnce(new Error('DB temporarily unavailable'));
    prismaMock.movement.update.mockResolvedValueOnce({ ...baseMovement, amount: 200 });

    const res = createMockRes();

    await byIdHandler(req, res);

    expect(prismaMock.movement.update).toHaveBeenCalledWith({
      where: { id: baseMovement.id },
      data: { amount: 200 },
    });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('uses session fallback and denies access when DB role lookup fails and user is not owner', async () => {
    const req = {
      method: 'PATCH',
      query: { id: baseMovement.id },
      body: { concept: 'Should fail' },
      auth: {
        user: { id: 'another-user', role: 'USER' },
      },
    } as unknown as NextApiRequest;

    prismaMock.movement.findUnique.mockResolvedValueOnce(baseMovement);
    prismaMock.user.findUnique.mockRejectedValueOnce(new Error('DB temporarily unavailable'));

    const res = createMockRes();

    await byIdHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Forbidden - You can only modify your own movements',
      code: 'NOT_OWNER',
    });
    expect(prismaMock.movement.update).not.toHaveBeenCalled();
  });

  it('returns 400 when PATCH body is empty (condition from schema refine)', async () => {
    const req = {
      method: 'PATCH',
      query: { id: baseMovement.id },
      body: {},
      auth: {
        user: { id: 'owner-1', role: 'USER' },
      },
    } as unknown as NextApiRequest;

    prismaMock.movement.findUnique.mockResolvedValueOnce(baseMovement);
    prismaMock.user.findUnique.mockResolvedValueOnce({ role: 'USER' } as any);

    const res = createMockRes();

    await byIdHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Validation error',
      errors: expect.anything(),
    });
    expect(prismaMock.movement.update).not.toHaveBeenCalled();
  });

  it('returns 404 when PATCH update fails with not found error', async () => {
    const req = {
      method: 'PATCH',
      query: { id: baseMovement.id },
      body: { concept: 'Updated' },
      auth: {
        user: { id: 'owner-1', role: 'USER' },
      },
    } as unknown as NextApiRequest;

    prismaMock.movement.findUnique.mockResolvedValueOnce(baseMovement);
    prismaMock.user.findUnique.mockResolvedValueOnce({ role: 'USER' } as any);
    prismaMock.movement.update.mockRejectedValueOnce(
      new Error('Record to update not found')
    );

    const res = createMockRes();

    await byIdHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Movement not found',
      code: 'MOVEMENT_NOT_FOUND',
    });
  });

  it('returns 500 when DELETE fails with generic database error', async () => {
    const req = {
      method: 'DELETE',
      query: { id: baseMovement.id },
      auth: {
        user: { id: 'owner-1', role: 'USER' },
      },
    } as unknown as NextApiRequest;

    prismaMock.movement.findUnique.mockResolvedValueOnce(baseMovement);
    prismaMock.user.findUnique.mockResolvedValueOnce({ role: 'USER' } as any);
    prismaMock.movement.delete.mockRejectedValueOnce(new Error('Unknown DB error'));

    const res = createMockRes();

    await byIdHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Internal server error',
      code: 'DATABASE_ERROR',
    });
  });
});
