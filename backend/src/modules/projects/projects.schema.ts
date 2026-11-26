import { MediaRole, PublishStatus } from '@prisma/client';
import { z } from 'zod';

export const projectIdParamSchema = z.object({
  id: z.string().uuid('Invalid project ID.'),
});

export const projectSlugParamSchema = z.object({
  slug: z.string().trim().min(1).max(160),
});

export const publicProjectsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  category: z.string().trim().max(80).optional(),
  search: z.string().trim().max(100).optional(),
  featured: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
  sort: z.enum(['publishedAt_desc', 'sortOrder_asc', 'title_asc']).default('publishedAt_desc'),
});

export const adminProjectsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: z.nativeEnum(PublishStatus).optional(),
  category: z.string().trim().max(80).optional(),
  search: z.string().trim().max(100).optional(),
  sort: z
    .enum(['updatedAt_desc', 'publishedAt_desc', 'sortOrder_asc', 'title_asc'])
    .default('updatedAt_desc'),
});

const projectMediaItemSchema = z
  .object({
    mediaId: z.string().uuid(),
    role: z.nativeEnum(MediaRole).default(MediaRole.GALLERY),
    sortOrder: z.number().int().min(0).max(1000).default(0),
  })
  .strict();

export const createProjectSchema = z
  .object({
    title: z.string().trim().min(2).max(180),
    slug: z.string().trim().min(2).max(180).optional(),
    excerpt: z.string().trim().max(500).default(''),
    description: z.string().trim().max(20000).default(''),
    category: z.string().trim().min(1).max(80),
    location: z.string().trim().max(160).nullable().optional(),
    area: z.string().trim().max(100).nullable().optional(),
    clientName: z.string().trim().max(160).nullable().optional(),
    completionDate: z.coerce.date().nullable().optional(),
    isFeatured: z.boolean().default(false),
    sortOrder: z.number().int().min(0).max(10000).default(0),
    seoTitle: z.string().trim().max(160).nullable().optional(),
    seoDescription: z.string().trim().max(320).nullable().optional(),
    media: z.array(projectMediaItemSchema).max(30).optional(),
  })
  .strict();

export const updateProjectSchema = z
  .object({
    title: z.string().trim().min(2).max(180).optional(),
    slug: z.string().trim().min(2).max(180).optional(),
    excerpt: z.string().trim().max(500).optional(),
    description: z.string().trim().max(20000).optional(),
    category: z.string().trim().min(1).max(80).optional(),
    location: z.string().trim().max(160).nullable().optional(),
    area: z.string().trim().max(100).nullable().optional(),
    clientName: z.string().trim().max(160).nullable().optional(),
    completionDate: z.coerce.date().nullable().optional(),
    isFeatured: z.boolean().optional(),
    sortOrder: z.number().int().min(0).max(10000).optional(),
    seoTitle: z.string().trim().max(160).nullable().optional(),
    seoDescription: z.string().trim().max(320).nullable().optional(),
    media: z.array(projectMediaItemSchema).max(30).optional(),
  })
  .strict()
  .refine((val) => Object.keys(val).length > 0, {
    message: 'At least one field must be provided for update.',
  });

export type PublicProjectsQuery = z.infer<typeof publicProjectsQuerySchema>;
export type AdminProjectsQuery = z.infer<typeof adminProjectsQuerySchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
