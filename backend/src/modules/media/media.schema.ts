import { z } from 'zod';

export const mediaIdParamSchema = z.object({
  id: z.string().uuid('Invalid media ID.'),
});

export const listMediaQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(24),
  search: z.string().trim().max(100).optional(),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']).optional(),
});

export const updateMediaSchema = z
  .object({
    altText: z.string().trim().max(240),
  })
  .strict();

export type ListMediaQuery = z.infer<typeof listMediaQuerySchema>;
export type UpdateMediaInput = z.infer<typeof updateMediaSchema>;
