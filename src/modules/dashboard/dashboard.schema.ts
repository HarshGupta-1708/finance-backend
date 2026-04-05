import { z } from 'zod';
import { DATE_ONLY_REGEX } from '../../utils/date';

const dateOnlyStringSchema = z
  .string()
  .regex(DATE_ONLY_REGEX, 'Expected date in YYYY-MM-DD format');

const dateRangeQuerySchema = z.object({
  startDate: dateOnlyStringSchema.optional(),
  endDate: dateOnlyStringSchema.optional(),
});

export const dashboardSummarySchema = z.object({
  query: dateRangeQuerySchema,
});

export const categoryBreakdownSchema = z.object({
  query: dateRangeQuerySchema,
});

export const monthlyTrendsSchema = z.object({
  query: z.object({
    year: z.coerce.number().int().min(2000).max(2100).optional(),
  }),
});

export const recentActivitySchema = z.object({
  query: z.object({
    limit: z.coerce.number().int().min(1).max(100).default(10),
  }),
});
