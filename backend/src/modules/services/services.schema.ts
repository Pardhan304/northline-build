import { PublishStatus } from '@prisma/client';
import { z } from 'zod';

export const serviceIdParamSchema = z.object({
  id: z.string().uuid('Invalid service ID.'),
});

export const createServiceSchema = z
  .object({
    title: z.string().trim().min(2).max(160),
    slug: z.string().trim().min(2).max(160).optional(),
    summary: z.string().trim().min(2).max(500),
    description: z.string().trim().max(10000).default(''),
    status: z.nativeEnum(PublishStatus).default(PublishStatus.DRAFT),
    sortOrder: z.number().int().min(0).max(1000).default(0),
    iconKey: z
      .string()
      .trim()
      .max(60)
      .regex(/^[a-z0-9_-]+$/i)
      .nullable()
      .optional(),
  })
  .strict();

export const updateServiceSchema = z
  .object({
    title: z.string().trim().min(2).max(160).optional(),
    slug: z.string().trim().min(2).max(160).optional(),
    summary: z.string().trim().min(2).max(500).optional(),
    description: z.string().trim().max(10000).optional(),
    status: z.nativeEnum(PublishStatus).optional(),
    sortOrder: z.number().int().min(0).max(1000).optional(),
    iconKey: z
      .string()
      .trim()
      .max(60)
      .regex(/^[a-z0-9_-]+$/i)
      .nullable()
      .optional(),
  })
  .strict()
  .refine((val) => Object.keys(val).length > 0, {
    message: 'At least one field must be provided for update.',
  });

export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
