const PrismaClientMock = jest.fn();

jest.mock('@prisma/client', () => ({
  PrismaClient: PrismaClientMock,
}));

describe('prisma singleton', () => {
  beforeEach(() => {
    jest.resetModules();
    delete (globalThis as { prisma?: unknown }).prisma;
    PrismaClientMock.mockClear();
  });

  it('creates a new client and stores it on globalThis in non-production', () => {
    const previousEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'test';

    const { prisma } = require('@/lib/db');

    expect(PrismaClientMock).toHaveBeenCalledTimes(1);
    expect((globalThis as { prisma?: unknown }).prisma).toBe(prisma);

    process.env.NODE_ENV = previousEnv;
  });

  it('reuses the existing global client when available', () => {
    const existing = { sentinel: true };
    (globalThis as { prisma?: unknown }).prisma = existing;

    const { prisma } = require('@/lib/db');

    expect(prisma).toBe(existing);
    expect(PrismaClientMock).not.toHaveBeenCalled();
  });
});
