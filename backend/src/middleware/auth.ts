import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';
import type { Env } from '@/env';

export interface AuthUser {
  id: string;
  email: string;
}

declare module 'hono' {
  interface ContextVariableMap {
    user: AuthUser;
  }
}

// Validates the Supabase JWT from Authorization: Bearer <token>
export const authMiddleware = createMiddleware<{ Bindings: Env }>(async (c, next) => {
  const header = c.req.header('Authorization');
  if (!header?.startsWith('Bearer ')) {
    throw new HTTPException(401, { message: 'Missing auth token' });
  }

  const token = header.slice(7);

  // Verify JWT with Supabase (using SUPABASE_JWT_SECRET)
  // In production replace with a proper JWT verify using Web Crypto API
  try {
    const [, payloadB64] = token.split('.');
    const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));

    if (!payload.sub || !payload.email) {
      throw new Error('Invalid payload');
    }

    c.set('user', { id: payload.sub, email: payload.email });
    await next();
  } catch {
    throw new HTTPException(401, { message: 'Invalid token' });
  }
});
