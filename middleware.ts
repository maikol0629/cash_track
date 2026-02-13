import { NextRequest, NextResponse } from 'next/server';

export function middleware(_request: NextRequest) {
  // La lógica de autenticación y roles se maneja en los API routes
  // (withAuth/withRole) y en el cliente (RoleGuard). El middleware
  // no puede usar Prisma porque corre en runtime Edge.
  return NextResponse.next();
}

export const config = {
  matcher: ['/users/:path*', '/reports/:path*', '/transactions/:path*'],
};
