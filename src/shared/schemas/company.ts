import { z } from 'zod';

export const createCompanySchema = z.object({
  name: z.string().min(1, 'Company name is required').max(200),
  domain: z.string().max(200).optional().nullable(),
  industry: z.string().max(100).optional().nullable(),
});

export const updateCompanySchema = createCompanySchema.partial();

export const companyQuerySchema = z.object({
  search: z.string().optional(),
  industry: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  cursor: z.string().optional(),
  sort: z.string().default('-createdAt'),
});

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
export type CompanyQuery = z.infer<typeof companyQuerySchema>;
