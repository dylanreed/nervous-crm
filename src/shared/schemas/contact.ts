import { z } from 'zod';

export const createContactSchema = z.object({
  name: z.string().min(1, 'Contact name is required').max(200),
  email: z.string().email().max(200).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  title: z.string().max(100).optional().nullable(),
  companyId: z.string().cuid().optional().nullable(),
  ownerId: z.string().cuid().optional(), // Defaults to current user
});

export const updateContactSchema = createContactSchema.partial();

export const contactQuerySchema = z.object({
  search: z.string().optional(),
  companyId: z.string().cuid().optional(),
  ownerId: z.string().cuid().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  cursor: z.string().optional(),
  sort: z.string().default('-createdAt'),
  include: z.string().optional(), // e.g., "company,activities"
});

export type CreateContactInput = z.infer<typeof createContactSchema>;
export type UpdateContactInput = z.infer<typeof updateContactSchema>;
export type ContactQuery = z.infer<typeof contactQuerySchema>;
