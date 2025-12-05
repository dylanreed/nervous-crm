import { prisma } from '../db/client.js';
import { randomBytes } from 'crypto';
import type { Role } from '@prisma/client';
import type { InviteUserInput } from '../shared/schemas/index.js';

export class TeamService {
  async getTeam(teamId: string) {
    return prisma.team.findUnique({
      where: { id: teamId },
    });
  }

  async updateTeam(teamId: string, data: { name?: string }) {
    return prisma.team.update({
      where: { id: teamId },
      data,
    });
  }

  async getMembers(teamId: string) {
    return prisma.user.findMany({
      where: { teamId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async inviteUser(teamId: string, input: InviteUserInput) {
    // Check if user already exists in team
    const existingUser = await prisma.user.findFirst({
      where: {
        email: input.email.toLowerCase(),
        teamId,
      },
    });

    if (existingUser) {
      throw new TeamError('USER_EXISTS', 'User is already a member of this team');
    }

    // Check for pending invite
    const existingInvite = await prisma.invite.findFirst({
      where: {
        email: input.email.toLowerCase(),
        teamId,
        status: 'pending',
      },
    });

    if (existingInvite) {
      throw new TeamError('INVITE_EXISTS', 'An invite has already been sent to this email');
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    return prisma.invite.create({
      data: {
        email: input.email.toLowerCase(),
        role: input.role as Role,
        token,
        teamId,
        expiresAt,
      },
    });
  }

  async getPendingInvites(teamId: string) {
    return prisma.invite.findMany({
      where: {
        teamId,
        status: 'pending',
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async cancelInvite(teamId: string, inviteId: string) {
    const invite = await prisma.invite.findFirst({
      where: { id: inviteId, teamId },
    });

    if (!invite) {
      throw new TeamError('INVITE_NOT_FOUND', 'Invite not found');
    }

    await prisma.invite.delete({ where: { id: inviteId } });
  }

  async removeMember(teamId: string, userId: string, requestingUserId: string) {
    const user = await prisma.user.findFirst({
      where: { id: userId, teamId },
    });

    if (!user) {
      throw new TeamError('USER_NOT_FOUND', 'User not found in team');
    }

    if (user.role === 'owner') {
      throw new TeamError('CANNOT_REMOVE_OWNER', 'Cannot remove the team owner');
    }

    if (userId === requestingUserId) {
      throw new TeamError('CANNOT_REMOVE_SELF', 'Cannot remove yourself from the team');
    }

    await prisma.user.delete({ where: { id: userId } });
  }

  async updateMemberRole(teamId: string, userId: string, role: Role, requestingUserId: string) {
    const user = await prisma.user.findFirst({
      where: { id: userId, teamId },
    });

    if (!user) {
      throw new TeamError('USER_NOT_FOUND', 'User not found in team');
    }

    if (user.role === 'owner') {
      throw new TeamError('CANNOT_CHANGE_OWNER', 'Cannot change the owner role');
    }

    if (role === 'owner') {
      throw new TeamError('CANNOT_ASSIGN_OWNER', 'Cannot assign owner role');
    }

    if (userId === requestingUserId) {
      throw new TeamError('CANNOT_CHANGE_SELF', 'Cannot change your own role');
    }

    return prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });
  }
}

export class TeamError extends Error {
  constructor(
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'TeamError';
  }
}

export const teamService = new TeamService();
