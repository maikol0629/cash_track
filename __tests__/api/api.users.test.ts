import type { NextApiRequest } from 'next';
import { createMockRes, prismaMock } from '../test-utils/api';
import usersHandler from '@/pages/api/users';
import userByIdHandler from '@/pages/api/users/[id]';

describe('GET /api/users RBAC', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 for unauthenticated user', async () => {
    const req = {
      method: 'GET',
      // no auth
    } as unknown as NextApiRequest;

    const res = createMockRes();

    await usersHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
    expect(prismaMock.user.findMany).not.toHaveBeenCalled();
  });

  it('returns 403 for USER role (only admins can view users)', async () => {
    const req = {
      method: 'GET',
      auth: {
        user: { id: 'user-1', role: 'USER' },
      },
    } as unknown as NextApiRequest;

    const res = createMockRes();

    await usersHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Forbidden' });
    expect(prismaMock.user.findMany).not.toHaveBeenCalled();
  });

  it('ADMIN role successfully retrieves all users list with correct fields', async () => {
    const req = {
      method: 'GET',
      auth: {
        user: { id: 'admin-1', role: 'ADMIN' },
      },
    } as unknown as NextApiRequest;

    const users = [
      {
        id: '1',
        name: 'User One',
        email: 'user1@example.com',
        phone: null,
        role: 'USER',
      },
      {
        id: '2',
        name: 'Admin',
        email: 'admin@example.com',
        phone: '+57 3001234567',
        role: 'ADMIN',
      },
    ];

    prismaMock.user.findMany.mockResolvedValueOnce(users);

    const res = createMockRes();

    await usersHandler(req, res);

    expect(prismaMock.user.findMany).toHaveBeenCalledWith({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    expect(res.status).toHaveBeenCalledWith(200);
    const body = (res.json as jest.Mock).mock.calls[0][0] as typeof users;
    expect(body).toHaveLength(2);

    body.forEach((user) => {
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('name');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('phone');
      expect(user).toHaveProperty('role');
      expect((user as any).password).toBeUndefined();
    });
  });
});

describe('PATCH /api/users/[id] RBAC and validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 for unauthenticated user', async () => {
    const req = {
      method: 'PATCH',
      query: { id: 'user-1' },
      body: { name: 'New Name' },
      // no auth
    } as unknown as NextApiRequest;

    const res = createMockRes();

    await userByIdHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it('returns 403 for USER role (only admins can edit users)', async () => {
    const req = {
      method: 'PATCH',
      query: { id: 'user-1' },
      body: { name: 'New Name' },
      auth: {
        user: { id: 'user-1', role: 'USER' },
      },
    } as unknown as NextApiRequest;

    const res = createMockRes();

    await userByIdHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Forbidden' });
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it('ADMIN successfully updates user name', async () => {
    const req = {
      method: 'PATCH',
      query: { id: 'user-1' },
      body: { name: 'Updated Name' },
      auth: {
        user: { id: 'admin-1', role: 'ADMIN' },
      },
    } as unknown as NextApiRequest;

    const updatedUser = {
      id: 'user-1',
      name: 'Updated Name',
      email: 'user1@example.com',
      phone: null,
      role: 'USER',
    };

    prismaMock.user.update.mockResolvedValueOnce(updatedUser);

    const res = createMockRes();

    await userByIdHandler(req, res);

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { name: 'Updated Name' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
      },
    });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(updatedUser);
  });

  it('ADMIN successfully updates user role', async () => {
    const req = {
      method: 'PATCH',
      query: { id: 'user-1' },
      body: { role: 'ADMIN' },
      auth: {
        user: { id: 'admin-1', role: 'ADMIN' },
      },
    } as unknown as NextApiRequest;

    const updatedUser = {
      id: 'user-1',
      name: 'User One',
      email: 'user1@example.com',
      phone: null,
      role: 'ADMIN',
    };

    prismaMock.user.update.mockResolvedValueOnce(updatedUser);

    const res = createMockRes();

    await userByIdHandler(req, res);

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { role: 'ADMIN' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
      },
    });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(updatedUser);
  });

  it("returns 404 when user doesn't exist", async () => {
    const req = {
      method: 'PATCH',
      query: { id: 'missing-user' },
      body: { name: 'New Name' },
      auth: {
        user: { id: 'admin-1', role: 'ADMIN' },
      },
    } as unknown as NextApiRequest;

    const updateError = new Error('Record to update not found');
    prismaMock.user.update.mockRejectedValueOnce(updateError);

    const res = createMockRes();

    await userByIdHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: 'User not found',
      code: 'USER_NOT_FOUND',
    });
  });

  it('validates role values and rejects invalid ones with 400', async () => {
    const req = {
      method: 'PATCH',
      query: { id: 'user-1' },
      body: { role: 'SUPERADMIN' },
      auth: {
        user: { id: 'admin-1', role: 'ADMIN' },
      },
    } as unknown as NextApiRequest;

    const res = createMockRes();

    await userByIdHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid role value' });
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });
});

describe('DELETE /api/users/[id] RBAC and behavior', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 for unauthenticated user', async () => {
    const req = {
      method: 'DELETE',
      query: { id: 'user-1' },
      // no auth
    } as unknown as NextApiRequest;

    const res = createMockRes();

    await userByIdHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });

  it('returns 403 for USER role (only admins can delete users)', async () => {
    const req = {
      method: 'DELETE',
      query: { id: 'user-1' },
      auth: {
        user: { id: 'user-1', role: 'USER' },
      },
    } as unknown as NextApiRequest;

    const res = createMockRes();

    await userByIdHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Forbidden' });
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });

  it('returns 404 when user to delete does not exist', async () => {
    const req = {
      method: 'DELETE',
      query: { id: 'missing-id' },
      auth: {
        user: { id: 'admin-1', role: 'ADMIN' },
      },
    } as unknown as NextApiRequest;

    prismaMock.user.findUnique.mockResolvedValueOnce(null);

    const res = createMockRes();

    await userByIdHandler(req, res);

    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'missing-id' },
      select: { id: true, role: true },
    });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
  });

  it('prevents deleting the last ADMIN user', async () => {
    const req = {
      method: 'DELETE',
      query: { id: 'admin-1' },
      auth: {
        user: { id: 'admin-1', role: 'ADMIN' },
      },
    } as unknown as NextApiRequest;

    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 'admin-1',
      role: 'ADMIN',
    } as any);
    prismaMock.user.count.mockResolvedValueOnce(1);

    const res = createMockRes();

    await userByIdHandler(req, res);

    expect(prismaMock.user.count).toHaveBeenCalledWith({
      where: { role: 'ADMIN' },
    });
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Cannot delete the last admin user',
    });
    expect(prismaMock.user.delete).not.toHaveBeenCalled();
  });

  it('allows ADMIN to delete a non-admin user', async () => {
    const req = {
      method: 'DELETE',
      query: { id: 'user-1' },
      auth: {
        user: { id: 'admin-1', role: 'ADMIN' },
      },
    } as unknown as NextApiRequest;

    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 'user-1',
      role: 'USER',
    } as any);

    const res = createMockRes();

    await userByIdHandler(req, res);

    expect(prismaMock.user.delete).toHaveBeenCalledWith({
      where: { id: 'user-1' },
    });
    expect(res.status).toHaveBeenCalledWith(204);
  });
});
