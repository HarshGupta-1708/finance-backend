import { Role } from '@prisma/client';
import { z } from 'zod';

export const createUserSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    password: z.string().min(8).max(100),
    role: z.nativeEnum(Role).default(Role.VIEWER),
    isActive: z.boolean().optional().default(true),
  }),
});

export const listUsersSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    search: z.string().trim().optional(),
  }),
});

export const userIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const updateRoleSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    role: z.nativeEnum(Role),
  }),
});

export type CreateUserInput = z.infer<typeof createUserSchema>['body'];
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>['body'];
