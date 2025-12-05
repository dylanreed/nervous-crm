import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware } from '../../lib/auth';
import { activityService } from '../../services/activity.service';
import {
  createActivitySchema,
  updateActivitySchema,
  activityQuerySchema,
  type CreateActivityInput,
  type UpdateActivityInput,
} from '../../shared/schemas';

export async function activitiesRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.addHook('preHandler', authMiddleware);

  // GET /api/v1/activities
  fastify.get(
    '/',
    async (request: FastifyRequest<{ Querystring: Record<string, string> }>, reply: FastifyReply) => {
      const parseResult = activityQuerySchema.safeParse(request.query);
      if (!parseResult.success) {
        return reply.status(400).send({
          error: { code: 'VALIDATION_ERROR', message: 'Invalid query parameters' },
        });
      }

      const result = await activityService.list(request.auth!.teamId, parseResult.data);
      return result;
    }
  );

  // GET /api/v1/activities/upcoming
  fastify.get('/upcoming', async (request: FastifyRequest<{ Querystring: { days?: string } }>) => {
    const days = request.query.days ? parseInt(request.query.days, 10) : 7;
    const activities = await activityService.getUpcoming(
      request.auth!.teamId,
      request.auth!.userId,
      days
    );
    return { data: activities };
  });

  // GET /api/v1/activities/overdue
  fastify.get('/overdue', async (request: FastifyRequest) => {
    const activities = await activityService.getOverdue(
      request.auth!.teamId,
      request.auth!.userId
    );
    return { data: activities };
  });

  // GET /api/v1/activities/:id
  fastify.get<{ Params: { id: string }; Querystring: { include?: string } }>(
    '/:id',
    async (
      request: FastifyRequest<{ Params: { id: string }; Querystring: { include?: string } }>,
      reply: FastifyReply
    ) => {
      const activity = await activityService.getById(
        request.auth!.teamId,
        request.params.id,
        request.query.include
      );

      if (!activity) {
        return reply.status(404).send({
          error: { code: 'NOT_FOUND', message: 'Activity not found' },
        });
      }

      return { data: activity };
    }
  );

  // POST /api/v1/activities
  fastify.post<{ Body: CreateActivityInput }>(
    '/',
    async (request: FastifyRequest<{ Body: CreateActivityInput }>, reply: FastifyReply) => {
      const parseResult = createActivitySchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details: parseResult.error.flatten().fieldErrors,
          },
        });
      }

      const activity = await activityService.create(
        request.auth!.teamId,
        request.auth!.userId,
        parseResult.data
      );
      return reply.status(201).send({ data: activity });
    }
  );

  // PUT /api/v1/activities/:id
  fastify.put<{ Params: { id: string }; Body: UpdateActivityInput }>(
    '/:id',
    async (
      request: FastifyRequest<{ Params: { id: string }; Body: UpdateActivityInput }>,
      reply: FastifyReply
    ) => {
      const parseResult = updateActivitySchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details: parseResult.error.flatten().fieldErrors,
          },
        });
      }

      const activity = await activityService.update(
        request.auth!.teamId,
        request.params.id,
        parseResult.data
      );

      if (!activity) {
        return reply.status(404).send({
          error: { code: 'NOT_FOUND', message: 'Activity not found' },
        });
      }

      return { data: activity };
    }
  );

  // POST /api/v1/activities/:id/toggle - Toggle completion status
  fastify.post<{ Params: { id: string } }>(
    '/:id/toggle',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const activity = await activityService.toggleComplete(
        request.auth!.teamId,
        request.params.id
      );

      if (!activity) {
        return reply.status(404).send({
          error: { code: 'NOT_FOUND', message: 'Activity not found' },
        });
      }

      return { data: activity };
    }
  );

  // DELETE /api/v1/activities/:id
  fastify.delete<{ Params: { id: string } }>(
    '/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const deleted = await activityService.delete(request.auth!.teamId, request.params.id);

      if (!deleted) {
        return reply.status(404).send({
          error: { code: 'NOT_FOUND', message: 'Activity not found' },
        });
      }

      return { data: { message: 'Activity deleted' } };
    }
  );
}
