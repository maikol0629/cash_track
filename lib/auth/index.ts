import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import type { NextApiHandler, NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

// Cliente Prisma compartido para el adaptador de Better Auth
const prisma = new PrismaClient();

// Configuración principal de Better Auth, usando Prisma como adaptador
export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
  },
});

// Role type aligned with the Prisma enum and business rules
export type Role = 'USER' | 'ADMIN';

type BaseAuthSession = NonNullable<
  Awaited<ReturnType<typeof auth.api.getSession>>
>;

export type SessionUser = BaseAuthSession['user'] & { role: Role };

// Extend the base session type so `user.role` is available in TypeScript
export type AuthSession = Omit<BaseAuthSession, 'user'> & {
  user: SessionUser;
};

// Convierte los headers de Next en un objeto Headers estándar para Better Auth
const createHeadersFromRequest = (req: NextApiRequest): Headers => {
  const headers = new Headers();

  Object.entries(req.headers).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((v) => {
        if (v !== null && v !== undefined) headers.append(key, v);
      });
    } else if (value !== null && value !== undefined) {
      headers.set(key, String(value));
    }
  });

  return headers;
};

// Obtiene la sesión del usuario a partir de la request de Next.js
export const getServerSession = async (
  req: NextApiRequest
): Promise<AuthSession | null> => {
  const headers = createHeadersFromRequest(req);
  const session = await auth.api.getSession({ headers });

  return (session ?? null) as AuthSession | null;
};

export type AuthenticatedRequest = NextApiRequest & {
  auth: AuthSession;
};

type HandlerWithAuth = (
  req: AuthenticatedRequest,
  res: NextApiResponse
) => unknown | Promise<unknown>;

// Envuelve un handler de API y garantiza que llegue una sesión en req.auth
export const withAuth = (
  handler: HandlerWithAuth,
  options: { required?: boolean } = { required: true }
): NextApiHandler => {
  const { required = true } = options;

  const wrapped: NextApiHandler = async (req, res) => {
    const session = await getServerSession(req);

    if (!session && required) {
      return res
        .status(401)
        .json({ message: 'Unauthorized', code: 'UNAUTHORIZED' });
    }

    if (!session) {
      // Not required and no session; handler decides how to behave
      return handler(req as AuthenticatedRequest, res);
    }

    (req as AuthenticatedRequest).auth = session;
    return handler(req as AuthenticatedRequest, res);
  };

  return wrapped;
};

// Envuelve un handler y verifica que el usuario tenga alguno de los roles permitidos
export const withRole = (
  roles: Role | Role[],
  handler: HandlerWithAuth
): NextApiHandler => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  return withAuth(async (req, res) => {
    // Intentar obtener el rol más actualizado desde la base de datos,
    // y usar el de sesión como respaldo si ya viene informado.
    let effectiveRole: Role | undefined;

    try {
      // Se intenta consultar el rol más reciente directamente en base de datos
      const dbUser = await prisma.user.findUnique({
        where: { id: req.auth.user.id },
        select: { role: true },
      });

      effectiveRole =
        (dbUser?.role as Role | undefined) ??
        (req.auth.user.role as Role | undefined);
    } catch {
      // En caso de error al consultar BD, se usa el rol de la sesión
      effectiveRole = req.auth.user.role as Role | undefined;
    }

    if (!effectiveRole || !allowedRoles.includes(effectiveRole)) {
      return res.status(403).json({ message: 'Forbidden', code: 'FORBIDDEN' });
    }

    return handler(req, res);
  });
};

export type Session = AuthSession;
