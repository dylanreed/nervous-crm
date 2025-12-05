import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware, requireRole } from '../../lib/auth';
import { teamService, TeamError } from '../../services/team.service';
import { inviteUserSchema, type InviteUserInput } from '../../shared/schemas';
import { z } from 'zod';

export async function teamsRoutes(fastify: FastifyInstance): Promise<void> {
  // All routes require authentication
  fastify.addHook('preHandler', authMiddleware);

  // GET /api/v1/teams/me
  fastify.get('/me', async (request: FastifyRequest) => {
    const team = await teamService.getTeam(request.auth!.teamId);
    return { data: team };
  });

  // PUT /api/v1/teams/me (admin/owner only)
  fastify.put<{ Body: { name: string } }>(
    '/me',
    { preHandler: requireRole('owner', 'admin') },
    async (request: FastifyRequest<{ Body: { name: string } }>, reply: FastifyReply) => {
      const schema = z.object({ name: z.string().min(1).max(100) });
      const parseResult = schema.safeParse(request.body);

      if (!parseResult.success) {
        return reply.status(400).send({
          error: { code: 'VALIDATION_ERROR', message: 'Invalid input' },
        });
      }

      const team = await teamService.updateTeam(request.auth!.teamId, parseResult.data);
      return { data: team };
    }
  );

  // GET /api/v1/teams/members
  fastify.get('/members', async (request: FastifyRequest) => {
    const members = await teamService.getMembers(request.auth!.teamId);
    return { data: members };
  });

  // POST /api/v1/teams/invite (admin/owner only)
  fastify.post<{ Body: InviteUserInput }>(
    '/invite',
    { preHandler: requireRole('owner', 'admin') },
    async (request: FastifyRequest<{ Body: InviteUserInput }>, reply: FastifyReply) => {
      const parseResult = inviteUserSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details: parseResult.error.flatten().fieldErrors,
          },
        });
      }

      try {
        const invite = await teamService.inviteUser(request.auth!.teamId, parseResult.data);
        return {
          data: {
            id: invite.id,
            email: invite.email,
            role: invite.role,
            token: invite.token, // Frontend will use this to construct invite link
            expiresAt: invite.expiresAt,
          },
        };
      } catch (error) {
        if (error instanceof TeamError) {
          return reply.status(400).send({
            error: { code: error.code, message: error.message },
          });
        }
        throw error;
      }
    }
  );

  // GET /api/v1/teams/invites (admin/owner only)
  fastify.get(
    '/invites',
    { preHandler: requireRole('owner', 'admin') },
    async (request: FastifyRequest) => {
      const invites = await teamService.getPendingInvites(request.auth!.teamId);
      return { data: invites };
    }
  );

  // DELETE /api/v1/teams/invites/:id (admin/owner only)
  fastify.delete<{ Params: { id: string } }>(
    '/invites/:id',
    { preHandler: requireRole('owner', 'admin') },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        await teamService.cancelInvite(request.auth!.teamId, request.params.id);
        return { data: { message: 'Invite cancelled' } };
      } catch (error) {
        if (error instanceof TeamError) {
          return reply.status(404).send({
            error: { code: error.code, message: error.message },
          });
        }
        throw error;
      }
    }
  );

  // DELETE /api/v1/teams/members/:id (admin/owner only)
  fastify.delete<{ Params: { id: string } }>(
    '/members/:id',
    { preHandler: requireRole('owner', 'admin') },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        await teamService.removeMember(
          request.auth!.teamId,
          request.params.id,
          request.auth!.userId
        );
        return { data: { message: 'Member removed' } };
      } catch (error) {
        if (error instanceof TeamError) {
          const status = error.code === 'USER_NOT_FOUND' ? 404 : 400;
          return reply.status(status).send({
            error: { code: error.code, message: error.message },
          });
        }
        throw error;
      }
    }
  );

  // PUT /api/v1/teams/members/:id/role (admin/owner only)
  fastify.put<{ Params: { id: string }; Body: { role: string } }>(
    '/members/:id/role',
    { preHandler: requireRole('owner', 'admin') },
    async (
      request: FastifyRequest<{ Params: { id: string }; Body: { role: string } }>,
      reply: FastifyReply
    ) => {
      const schema = z.object({ role: z.enum(['admin', 'member', 'viewer']) });
      const parseResult = schema.safeParse(request.body);

      if (!parseResult.success) {
        return reply.status(400).send({
          error: { code: 'VALIDATION_ERROR', message: 'Invalid role' },
        });
      }

      try {
        const user = await teamService.updateMemberRole(
          request.auth!.teamId,
          request.params.id,
          parseResult.data.role,
          request.auth!.userId
        );
        return { data: user };
      } catch (error) {
        if (error instanceof TeamError) {
          const status = error.code === 'USER_NOT_FOUND' ? 404 : 400;
          return reply.status(status).send({
            error: { code: error.code, message: error.message },
          });
        }
        throw error;
      }
    }
  );
}
