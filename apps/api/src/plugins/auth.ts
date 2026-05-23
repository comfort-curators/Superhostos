import { verifyToken } from '@clerk/backend';
import fp from 'fastify-plugin';
import type { FastifyPluginAsync } from 'fastify';
import type { AuthContext, UserRole } from '../lib/types';

declare module 'fastify' {
  interface FastifyRequest {
    auth: AuthContext | null;
  }
}

const authPluginImpl: FastifyPluginAsync = async (app) => {
  app.decorateRequest('auth', null);

  app.addHook('preHandler', async (req) => {
    const raw = req.headers.authorization;
    if (!raw?.startsWith('Bearer ')) return;
    const secretKey = process.env.CLERK_SECRET_KEY;
    if (!secretKey) return;

    const token = raw.slice(7);
    const verified = await verifyToken(token, { secretKey });
    const roleClaim = verified?.org_role;
    const role: UserRole = roleClaim === 'admin' ? 'admin' : 'operator';

    req.auth = {
      userId: verified.sub,
      orgId: verified.org_id ?? null,
      role
    };
  });
};

export const authPlugin = fp(authPluginImpl, { name: 'auth-plugin' });
