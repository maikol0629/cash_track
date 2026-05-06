import type { NextApiRequest, NextApiResponse } from 'next';

type MockAuthModule = {
  auth: {
    api: {
      getSession: jest.Mock;
    };
  };
  getServerSession: (req: NextApiRequest) => Promise<unknown>;
  withAuth: (
    handler: (req: any, res: NextApiResponse) => void | Promise<void>,
    options?: { required?: boolean }
  ) => (req: NextApiRequest, res: NextApiResponse) => Promise<void>;
  withRole: (
    roles: 'USER' | 'ADMIN' | Array<'USER' | 'ADMIN'>,
    handler: (req: any, res: NextApiResponse) => void | Promise<void>
  ) => (req: NextApiRequest, res: NextApiResponse) => Promise<void>;
};

const createMockRes = () => {
  const res: Partial<NextApiResponse> = {};
  res.status = jest.fn().mockReturnValue(res as NextApiResponse);
  res.json = jest.fn().mockReturnValue(res as NextApiResponse);
  return res as NextApiResponse;
};

const prismaMock = {
  user: {
    findUnique: jest.fn(),
  },
};

const loadAuthModule = () => {
  jest.resetModules();

  jest.doMock('@/lib/db', () => ({
    prisma: prismaMock,
  }));

  jest.doMock('better-auth/adapters/prisma', () => ({
    prismaAdapter: jest.fn(() => ({ adapter: true })),
  }));

  jest.doMock('better-auth', () => ({
    betterAuth: jest.fn(() => ({
      api: {
        getSession: jest.fn(),
      },
    })),
  }));

  return require('@/lib/auth') as MockAuthModule;
};

describe('lib/auth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.user.findUnique.mockReset();
    process.env.GITHUB_CLIENT_ID = 'github-client-id';
    process.env.GITHUB_CLIENT_SECRET = 'github-client-secret';
  });

  it('builds headers from the request and asks Better Auth for the session', async () => {
    const { auth, getServerSession } = loadAuthModule();
    const session = { user: { id: 'user-1', role: 'ADMIN' } };

    auth.api.getSession.mockResolvedValueOnce(session);

    const req = {
      headers: {
        authorization: 'Bearer token',
        'x-multi-value': ['first', 'second'],
        'x-empty': undefined,
      },
    } as unknown as NextApiRequest;

    await expect(getServerSession(req)).resolves.toEqual(session);

    expect(auth.api.getSession).toHaveBeenCalledWith({
      headers: expect.any(Headers),
    });

    const headers = auth.api.getSession.mock.calls[0][0].headers as Headers;
    expect(headers.get('authorization')).toBe('Bearer token');
    expect(headers.get('x-multi-value')).toBe('first, second');
    expect(headers.get('x-empty')).toBeNull();
  });

  it('returns 401 when authentication is required and no session exists', async () => {
    const { auth, withAuth } = loadAuthModule();
    auth.api.getSession.mockResolvedValueOnce(null);

    const handler = jest.fn();
    const wrapped = withAuth(handler);
    const res = createMockRes();

    await wrapped({ headers: {} } as NextApiRequest, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Unauthorized',
      code: 'UNAUTHORIZED',
    });
    expect(handler).not.toHaveBeenCalled();
  });

  it('passes the request through when auth is optional', async () => {
    const { auth, withAuth } = loadAuthModule();
    auth.api.getSession.mockResolvedValueOnce(null);

    const handler = jest.fn();
    const wrapped = withAuth(handler, { required: false });
    const req = { headers: {}, query: { page: '1' } } as NextApiRequest;
    const res = createMockRes();

    await wrapped(req, res);

    expect(handler).toHaveBeenCalledWith(req, res);
    expect((req as any).auth).toBeUndefined();
  });

  it('allows access when the database role matches one of the allowed roles', async () => {
    const { auth, withRole } = loadAuthModule();
    auth.api.getSession.mockResolvedValueOnce({
      user: { id: 'user-1', role: 'USER' },
    });
    prismaMock.user.findUnique.mockResolvedValueOnce({ role: 'ADMIN' });

    const handler = jest.fn();
    const wrapped = withRole('ADMIN', handler);
    const req = { headers: {} } as NextApiRequest;
    const res = createMockRes();

    await wrapped(req, res);

    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      select: { role: true },
    });
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        auth: expect.objectContaining({
          user: expect.objectContaining({ id: 'user-1', role: 'USER' }),
        }),
      }),
      res
    );
  });

  it('falls back to the session role when the database lookup fails', async () => {
    const { auth, withRole } = loadAuthModule();
    auth.api.getSession.mockResolvedValueOnce({
      user: { id: 'user-2', role: 'ADMIN' },
    });
    prismaMock.user.findUnique.mockRejectedValueOnce(new Error('db down'));

    const handler = jest.fn();
    const wrapped = withRole(['USER', 'ADMIN'], handler);
    const req = { headers: {} } as NextApiRequest;
    const res = createMockRes();

    await wrapped(req, res);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalledWith(403);
  });

  it('returns 403 when the effective role is not allowed', async () => {
    const { auth, withRole } = loadAuthModule();
    auth.api.getSession.mockResolvedValueOnce({
      user: { id: 'user-3', role: 'USER' },
    });
    prismaMock.user.findUnique.mockResolvedValueOnce({ role: 'USER' });

    const handler = jest.fn();
    const wrapped = withRole('ADMIN', handler);
    const req = { headers: {} } as NextApiRequest;
    const res = createMockRes();

    await wrapped(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Forbidden',
      code: 'FORBIDDEN',
    });
    expect(handler).not.toHaveBeenCalled();
  });

  it('returns 403 when no role can be resolved at all', async () => {
    const { auth, withRole } = loadAuthModule();
    auth.api.getSession.mockResolvedValueOnce({
      user: { id: 'user-4', role: undefined as any },
    });
    prismaMock.user.findUnique.mockResolvedValueOnce(null);

    const handler = jest.fn();
    const wrapped = withRole(['ADMIN'], handler);
    const req = { headers: {} } as NextApiRequest;
    const res = createMockRes();

    await wrapped(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Forbidden',
      code: 'FORBIDDEN',
    });
    expect(handler).not.toHaveBeenCalled();
  });
});