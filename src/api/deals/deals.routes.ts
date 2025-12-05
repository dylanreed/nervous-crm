import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware } from '../../lib/auth';
import { dealService } from '../../services/deal.service';
import {
  createDealSchema,
  updateDealSchema,
  dealQuerySchema,
  type CreateDealInput,
  type UpdateDealInput,
} from '../../shared/schemas';

export async function dealsRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.addHook('preHandler', authMiddleware);

  // GET /api/v1/deals
  fastify.get(
    '/',
    async (request: FastifyRequest<{ Querystring: Record<string, string> }>, reply: FastifyReply) => {
      const parseResult = dealQuerySchema.safeParse(request.query);
      if (!parseResult.success) {
        return reply.status(400).send({
          error: { code: 'VALIDATION_ERROR', message: 'Invalid query parameters' },
        });
      }

      const result = await dealService.list(request.auth!.teamId, parseResult.data);
      return result;
    }
  );

  // GET /api/v1/deals/pipeline - Get deals grouped by stage for Kanban view
  fastify.get('/pipeline', async (request: FastifyRequest) => {
    const pipeline = await dealService.getByStage(request.auth!.teamId);
    return { data: pipeline };
  });

  // GET /api/v1/deals/:id
  fastify.get<{ Params: { id: string }; Querystring: { include?: string } }>(
    '/:id',
    async (
      request: FastifyRequest<{ Params: { id: string }; Querystring: { include?: string } }>,
      reply: FastifyReply
    ) => {
      const deal = await dealService.getById(
        request.auth!.teamId,
        request.params.id,
        request.query.include
      );

      if (!deal) {
        return reply.status(404).send({
          error: { code: 'NOT_FOUND', message: 'Deal not found' },
        });
      }

      return { data: deal };
    }
  );

  // POST /api/v1/deals
  fastify.post<{ Body: CreateDealInput }>(
    '/',
    async (request: FastifyRequest<{ Body: CreateDealInput }>, reply: FastifyReply) => {
      const parseResult = createDealSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details: parseResult.error.flatten().fieldErrors,
          },
        });
      }

      const deal = await dealService.create(
        request.auth!.teamId,
        request.auth!.userId,
        parseResult.data
      );
      return reply.status(201).send({ data: deal });
    }
  );

  // PUT /api/v1/deals/:id
  fastify.put<{ Params: { id: string }; Body: UpdateDealInput }>(
    '/:id',
    async (
      request: FastifyRequest<{ Params: { id: string }; Body: UpdateDealInput }>,
      reply: FastifyReply
    ) => {
      const parseResult = updateDealSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details: parseResult.error.flatten().fieldErrors,
          },
        });
      }

      const deal = await dealService.update(
        request.auth!.teamId,
        request.params.id,
        parseResult.data
      );

      if (!deal) {
        return reply.status(404).send({
          error: { code: 'NOT_FOUND', message: 'Deal not found' },
        });
      }

      return { data: deal };
    }
  );

  // DELETE /api/v1/deals/:id
  fastify.delete<{ Params: { id: string } }>(
    '/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const deleted = await dealService.delete(request.auth!.teamId, request.params.id);

      if (!deleted) {
        return reply.status(404).send({
          error: { code: 'NOT_FOUND', message: 'Deal not found' },
        });
      }

      return { data: { message: 'Deal deleted' } };
    }
  );
}
