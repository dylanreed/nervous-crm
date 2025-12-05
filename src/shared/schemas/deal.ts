import { z } from 'zod';

const dealStages = ['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost'] as const;

export const createDealSchema = z.object({
  title: z.string().min(1, 'Deal title is required').max(200),
  value: z.coerce.number().min(0).optional().nullable(),
  stage: z.enum(dealStages).default('lead'),
  probability: z.coerce.number().min(0).max(100).optional().nullable(),
  companyId: z.string().cuid().optional().nullable(),
  contactId: z.string().cuid().optional().nullable(),
  ownerId: z.string().cuid().optional(), // Defaults to current user
});

export const updateDealSchema = createDealSchema.partial();

export const dealQuerySchema = z.object({
  search: z.string().optional(),
  stage: z.enum(dealStages).optional(),
  companyId: z.string().cuid().optional(),
  contactId: z.string().cuid().optional(),
  ownerId: z.string().cuid().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  cursor: z.string().optional(),
  sort: z.string().default('-createdAt'),
  include: z.string().optional(),
});

export type CreateDealInput = z.infer<typeof createDealSchema>;
export type UpdateDealInput = z.infer<typeof updateDealSchema>;
export type DealQuery = z.infer<typeof dealQuerySchema>;
