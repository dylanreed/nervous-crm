import type { FastifyRequest, FastifyReply } from 'fastify';
import type { Role } from '@prisma/client';
import { verifyAccessToken } from './jwt';

export interface AuthContext {
  userId: string;
  teamId: string;
  role: Role;
}

declare module 'fastify' {
  interface FastifyRequest {
    auth?: AuthContext;
  }
}

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const token = request.cookies.access_token;

  if (!token) {
    return reply.status(401).send({
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    });
  }

  try {
    const payload = await verifyAccessToken(token);
    request.auth = {
      userId: payload.userId,
      teamId: payload.teamId,
      role: payload.role as Role,
    };
  } catch {
    return reply.status(401).send({
      error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' },
    });
  }
}

export function requireRole(...roles: Role[]) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!request.auth) {
      return reply.status(401).send({
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    if (!roles.includes(request.auth.role)) {
      return reply.status(403).send({
        error: { code: 'FORBIDDEN', message: 'Insufficient permissions' },
      });
    }
  };
}
