import { Role } from '@prisma/client';
import { z } from 'zod';

export const userIdParamSchema = z.object({
  id: z.string().uuid('Invalid user ID.'),
});

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(100).optional(),
});

export const createUserSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(254),
    password: z.string().min(10, 'Password must be at least 10 characters.').max(200),
    role: z.nativeEnum(Role).default(Role.EDITOR),
  })
  .strict();

export const updateUserSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    role: z.nativeEnum(Role).optional(),
    isActive: z.boolean().optional(),
    password: z.string().min(10).max(200).optional(),
  })
  .strict()
  .refine((val) => Object.keys(val).length > 0, {
    message: 'At least one field must be provided for update.',
  });

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
