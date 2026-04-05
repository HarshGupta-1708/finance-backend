import { z } from 'zod';
import { DATE_ONLY_REGEX } from '../../utils/date';

const dateOnlyStringSchema = z
  .string()
  .regex(DATE_ONLY_REGEX, 'Expected date in YYYY-MM-DD format');

const createRecordBodySchema = z.object({
  amount: z.number().positive().max(999999999),
  type: z.enum(['INCOME', 'EXPENSE']),
  categoryId: z.number().int().positive(),
  recordDate: dateOnlyStringSchema,
  notes: z.string().max(500).optional(),
  userId: z.string().uuid().optional(),
});

const updateRecordBodySchema = z.object({
  amount: z.number().positive().max(999999999).optional(),
  type: z.enum(['INCOME', 'EXPENSE']).optional(),
  categoryId: z.number().int().positive().optional(),
  recordDate: dateOnlyStringSchema.optional(),
  notes: z.string().max(500).optional(),
});

export const createRecordSchema = z.object({
  body: createRecordBodySchema,
});

export const updateRecordSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: updateRecordBodySchema,
});

export const listRecordsSchema = z.object({
  query: z.object({
    type: z.enum(['INCOME', 'EXPENSE']).optional(),
    categoryId: z.coerce.number().int().positive().optional(),
    category: z.string().trim().optional(),
    startDate: dateOnlyStringSchema.optional(),
    endDate: dateOnlyStringSchema.optional(),
    search: z.string().trim().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
  }),
});

export const recordIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export type CreateRecordInput = z.infer<typeof createRecordBodySchema>;
export type UpdateRecordInput = z.infer<typeof updateRecordBodySchema>;
export type ListRecordsInput = z.infer<typeof listRecordsSchema>['query'];
