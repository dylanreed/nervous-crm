import { prisma } from '../db/client.js';
import type { Prisma, ActivityType } from '@prisma/client';
import type { CreateActivityInput, UpdateActivityInput, ActivityQuery } from '../shared/schemas/index.js';

export class ActivityService {
  async list(teamId: string, query: ActivityQuery) {
    const {
      type,
      dealId,
      contactId,
      userId,
      completed,
      dueBefore,
      dueAfter,
      limit,
      cursor,
      sort,
      include,
    } = query;

    const where: Prisma.ActivityWhereInput = {
      teamId,
      ...(type && { type: type as ActivityType }),
      ...(dealId && { dealId }),
      ...(contactId && { contactId }),
      ...(userId && { userId }),
      ...(completed === 'true' && { completedAt: { not: null } }),
      ...(completed === 'false' && { completedAt: null }),
      ...(dueBefore && { dueAt: { lte: dueBefore } }),
      ...(dueAfter && { dueAt: { gte: dueAfter } }),
    };

    const orderBy = this.parseSort(sort);
    const includes = this.parseIncludes(include);

    const activities = await prisma.activity.findMany({
      where,
      orderBy,
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      include: {
        ...includes,
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    const hasMore = activities.length > limit;
    const data = hasMore ? activities.slice(0, -1) : activities;
    const nextCursor = hasMore ? data[data.length - 1]?.id : null;

    const total = await prisma.activity.count({ where });

    return {
      data,
      pagination: {
        total,
        limit,
        cursor: nextCursor,
        hasMore,
      },
    };
  }

  async getById(teamId: string, id: string, include?: string) {
    const includes = this.parseIncludes(include);

    return prisma.activity.findFirst({
      where: { id, teamId },
      include: {
        ...includes,
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async create(teamId: string, userId: string, input: CreateActivityInput) {
    return prisma.activity.create({
      data: {
        type: input.type as ActivityType,
        title: input.title,
        description: input.description,
        dueAt: input.dueAt,
        dealId: input.dealId,
        contactId: input.contactId,
        userId,
        teamId,
      },
      include: {
        deal: { select: { id: true, title: true } },
        contact: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async update(teamId: string, id: string, input: UpdateActivityInput) {
    const activity = await prisma.activity.findFirst({
      where: { id, teamId },
    });

    if (!activity) {
      return null;
    }

    return prisma.activity.update({
      where: { id },
      data: {
        ...(input.type && { type: input.type as ActivityType }),
        ...(input.title !== undefined && { title: input.title }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.dueAt !== undefined && { dueAt: input.dueAt }),
        ...(input.completedAt !== undefined && { completedAt: input.completedAt }),
        ...(input.dealId !== undefined && { dealId: input.dealId }),
        ...(input.contactId !== undefined && { contactId: input.contactId }),
      },
      include: {
        deal: { select: { id: true, title: true } },
        contact: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async toggleComplete(teamId: string, id: string) {
    const activity = await prisma.activity.findFirst({
      where: { id, teamId },
    });

    if (!activity) {
      return null;
    }

    return prisma.activity.update({
      where: { id },
      data: {
        completedAt: activity.completedAt ? null : new Date(),
      },
      include: {
        deal: { select: { id: true, title: true } },
        contact: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async delete(teamId: string, id: string) {
    const activity = await prisma.activity.findFirst({
      where: { id, teamId },
    });

    if (!activity) {
      return false;
    }

    await prisma.activity.delete({ where: { id } });
    return true;
  }

  async getUpcoming(teamId: string, userId?: string, days: number = 7) {
    const now = new Date();
    const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    return prisma.activity.findMany({
      where: {
        teamId,
        ...(userId && { userId }),
        completedAt: null,
        dueAt: {
          gte: now,
          lte: future,
        },
      },
      orderBy: { dueAt: 'asc' },
      take: 20,
      include: {
        deal: { select: { id: true, title: true } },
        contact: { select: { id: true, name: true } },
        user: { select: { id: true, name: true } },
      },
    });
  }

  async getOverdue(teamId: string, userId?: string) {
    return prisma.activity.findMany({
      where: {
        teamId,
        ...(userId && { userId }),
        completedAt: null,
        dueAt: { lt: new Date() },
      },
      orderBy: { dueAt: 'asc' },
      include: {
        deal: { select: { id: true, title: true } },
        contact: { select: { id: true, name: true } },
        user: { select: { id: true, name: true } },
      },
    });
  }

  private parseSort(sort: string): Prisma.ActivityOrderByWithRelationInput {
    const desc = sort.startsWith('-');
    const field = desc ? sort.slice(1) : sort;

    const validFields = ['title', 'type', 'dueAt', 'createdAt', 'completedAt'];
    const orderField = validFields.includes(field) ? field : 'dueAt';

    return { [orderField]: desc ? 'desc' : 'asc' };
  }

  private parseIncludes(include?: string): Record<string, boolean | object> {
    if (!include) return {};

    const includes: Record<string, boolean | object> = {};
    const valid = ['deal', 'contact'];

    include.split(',').forEach((inc) => {
      const trimmed = inc.trim();
      if (valid.includes(trimmed)) {
        includes[trimmed] = true;
      }
    });

    return includes;
  }
}

export const activityService = new ActivityService();
