import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware } from '../../lib/auth.js';
import { companyService } from '../../services/company.service.js';
import {
  createCompanySchema,
  updateCompanySchema,
  companyQuerySchema,
  type CreateCompanyInput,
  type UpdateCompanyInput,
} from '../../shared/schemas/index.js';

export async function companiesRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.addHook('preHandler', authMiddleware);

  // GET /api/v1/companies
  fastify.get(
    '/',
    async (request: FastifyRequest<{ Querystring: Record<string, string> }>, reply: FastifyReply) => {
      const parseResult = companyQuerySchema.safeParse(request.query);
      if (!parseResult.success) {
        return reply.status(400).send({
          error: { code: 'VALIDATION_ERROR', message: 'Invalid query parameters' },
        });
      }

      const result = await companyService.list(request.auth!.teamId, parseResult.data);
      return result;
    }
  );

  // GET /api/v1/companies/:id
  fastify.get<{ Params: { id: string } }>(
    '/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const company = await companyService.getById(request.auth!.teamId, request.params.id);

      if (!company) {
        return reply.status(404).send({
          error: { code: 'NOT_FOUND', message: 'Company not found' },
        });
      }

      return { data: company };
    }
  );

  // POST /api/v1/companies
  fastify.post<{ Body: CreateCompanyInput }>(
    '/',
    async (request: FastifyRequest<{ Body: CreateCompanyInput }>, reply: FastifyReply) => {
      const parseResult = createCompanySchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details: parseResult.error.flatten().fieldErrors,
          },
        });
      }

      const company = await companyService.create(request.auth!.teamId, parseResult.data);
      return reply.status(201).send({ data: company });
    }
  );

  // PUT /api/v1/companies/:id
  fastify.put<{ Params: { id: string }; Body: UpdateCompanyInput }>(
    '/:id',
    async (
      request: FastifyRequest<{ Params: { id: string }; Body: UpdateCompanyInput }>,
      reply: FastifyReply
    ) => {
      const parseResult = updateCompanySchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details: parseResult.error.flatten().fieldErrors,
          },
        });
      }

      const company = await companyService.update(
        request.auth!.teamId,
        request.params.id,
        parseResult.data
      );

      if (!company) {
        return reply.status(404).send({
          error: { code: 'NOT_FOUND', message: 'Company not found' },
        });
      }

      return { data: company };
    }
  );

  // DELETE /api/v1/companies/:id
  fastify.delete<{ Params: { id: string } }>(
    '/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const deleted = await companyService.delete(request.auth!.teamId, request.params.id);

      if (!deleted) {
        return reply.status(404).send({
          error: { code: 'NOT_FOUND', message: 'Company not found' },
        });
      }

      return { data: { message: 'Company deleted' } };
    }
  );
}
