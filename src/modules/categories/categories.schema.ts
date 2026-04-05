import { RecordType } from '@prisma/client';
import { z } from 'zod';

const includeInactiveQuerySchema = z
  .enum(['true', 'false'])
  .optional()
  .transform((value) => value === 'true');

export const listCategoriesSchema = z.object({
  query: z.object({
    type: z.nativeEnum(RecordType).optional(),
    search: z.string().trim().optional(),
    includeInactive: includeInactiveQuerySchema,
  }),
});

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    type: z.nativeEnum(RecordType),
    description: z.string().max(255).optional(),
  }),
});

export const updateCategorySchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(255).nullable().optional(),
    isActive: z.boolean().optional(),
  }),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>['body'];
export type ListCategoriesInput = z.infer<typeof listCategoriesSchema>['query'];
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>['body'];
