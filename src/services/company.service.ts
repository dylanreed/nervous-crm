import { prisma } from '../db/client.js';
import type { Prisma } from '@prisma/client';
import type { CreateCompanyInput, UpdateCompanyInput, CompanyQuery } from '../shared/schemas/index.js';

export class CompanyService {
  async list(teamId: string, query: CompanyQuery) {
    const { search, industry, limit, cursor, sort } = query;

    const where: Prisma.CompanyWhereInput = {
      teamId,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { domain: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(industry && { industry }),
    };

    const orderBy = this.parseSort(sort);

    const companies = await prisma.company.findMany({
      where,
      orderBy,
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      include: {
        _count: {
          select: { contacts: true, deals: true },
        },
      },
    });

    const hasMore = companies.length > limit;
    const data = hasMore ? companies.slice(0, -1) : companies;
    const nextCursor = hasMore ? data[data.length - 1]?.id : null;

    const total = await prisma.company.count({ where });

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

  async getById(teamId: string, id: string) {
    return prisma.company.findFirst({
      where: { id, teamId },
      include: {
        _count: {
          select: { contacts: true, deals: true },
        },
      },
    });
  }

  async create(teamId: string, input: CreateCompanyInput) {
    return prisma.company.create({
      data: {
        ...input,
        teamId,
      },
    });
  }

  async update(teamId: string, id: string, input: UpdateCompanyInput) {
    const company = await prisma.company.findFirst({
      where: { id, teamId },
    });

    if (!company) {
      return null;
    }

    return prisma.company.update({
      where: { id },
      data: input,
    });
  }

  async delete(teamId: string, id: string) {
    const company = await prisma.company.findFirst({
      where: { id, teamId },
    });

    if (!company) {
      return false;
    }

    await prisma.company.delete({ where: { id } });
    return true;
  }

  private parseSort(sort: string): Prisma.CompanyOrderByWithRelationInput {
    const desc = sort.startsWith('-');
    const field = desc ? sort.slice(1) : sort;

    const validFields = ['name', 'createdAt', 'updatedAt'];
    const orderField = validFields.includes(field) ? field : 'createdAt';

    return { [orderField]: desc ? 'desc' : 'asc' };
  }
}

export const companyService = new CompanyService();
