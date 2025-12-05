import { z } from 'zod';

const activityTypes = ['call', 'email', 'meeting', 'task'] as const;

export const createActivitySchema = z.object({
  type: z.enum(activityTypes),
  title: z.string().min(1, 'Activity title is required').max(200),
  description: z.string().max(2000).optional().nullable(),
  dueAt: z.coerce.date().optional().nullable(),
  dealId: z.string().cuid().optional().nullable(),
  contactId: z.string().cuid().optional().nullable(),
});

export const updateActivitySchema = createActivitySchema.partial().extend({
  completedAt: z.coerce.date().optional().nullable(),
});

export const activityQuerySchema = z.object({
  type: z.enum(activityTypes).optional(),
  dealId: z.string().cuid().optional(),
  contactId: z.string().cuid().optional(),
  userId: z.string().cuid().optional(),
  completed: z.enum(['true', 'false']).optional(),
  dueBefore: z.coerce.date().optional(),
  dueAfter: z.coerce.date().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  cursor: z.string().optional(),
  sort: z.string().default('dueAt'),
  include: z.string().optional(),
});

export type CreateActivityInput = z.infer<typeof createActivitySchema>;
export type UpdateActivityInput = z.infer<typeof updateActivitySchema>;
export type ActivityQuery = z.infer<typeof activityQuerySchema>;
