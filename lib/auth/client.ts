import { createAuthClient } from 'better-auth/react';
import type { Role } from '@/lib/auth';

const baseURL = process.env.NEXT_PUBLIC_BETTER_AUTH_URL ?? 'http://localhost:3000/api/auth';

export const authClient = createAuthClient({
  baseURL,
});

type BaseClientSession = (typeof authClient.$Infer)['Session'];

export type ClientSession = Omit<BaseClientSession, 'user'> & {
  user: BaseClientSession['user'] & { role: Role };
};
