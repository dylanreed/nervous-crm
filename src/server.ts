import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { authRoutes } from './api/auth';
import { usersRoutes } from './api/users';
import { teamsRoutes } from './api/teams';
import { companiesRoutes } from './api/companies';
import { contactsRoutes } from './api/contacts';
import { dealsRoutes } from './api/deals';
import { activitiesRoutes } from './api/activities';

const fastify = Fastify({
  logger: true,
});

// Register plugins
fastify.register(cookie, {
  secret: process.env.COOKIE_SECRET || 'default-secret-change-in-production',
});

fastify.register(cors, {
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL
    : 'http://localhost:5173',
  credentials: true,
});

// Health check
fastify.get('/health', async () => {
  return { status: 'ok' };
});

// API routes
fastify.register(authRoutes, { prefix: '/api/v1/auth' });
fastify.register(usersRoutes, { prefix: '/api/v1/users' });
fastify.register(teamsRoutes, { prefix: '/api/v1/teams' });
fastify.register(companiesRoutes, { prefix: '/api/v1/companies' });
fastify.register(contactsRoutes, { prefix: '/api/v1/contacts' });
fastify.register(dealsRoutes, { prefix: '/api/v1/deals' });
fastify.register(activitiesRoutes, { prefix: '/api/v1/activities' });

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  fastify.register(fastifyStatic, {
    root: path.join(__dirname, '../web/dist'),
    prefix: '/',
  });

  // SPA fallback
  fastify.setNotFoundHandler((request, reply) => {
    if (request.url.startsWith('/api')) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Not found' } });
    }
    return reply.sendFile('index.html');
  });
}

const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3000', 10);
    await fastify.listen({ port, host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
