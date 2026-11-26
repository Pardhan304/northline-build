import { PublishStatus, SectionType } from '@prisma/client';
import { z } from 'zod';

export const pageSlugParamSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9-]+$/i, 'Invalid page slug.'),
});

const heroContentSchema = z
  .object({
    headline: z.string().trim().min(1).max(200),
    supportingText: z.string().trim().max(500).default(''),
    primaryCtaLabel: z.string().trim().max(80).optional(),
    primaryCtaHref: z.string().trim().max(240).optional(),
    secondaryCtaLabel: z.string().trim().max(80).optional(),
    secondaryCtaHref: z.string().trim().max(240).optional(),
    videoUrl: z.string().trim().max(500).nullable().optional(),
    posterMediaId: z.string().uuid().nullable().optional(),
    posterUrl: z.string().trim().max(500).nullable().optional(),
    eyebrow: z.string().trim().max(120).optional(),
  })
  .strict();

const richTextContentSchema = z
  .object({
    eyebrow: z.string().trim().max(120).optional(),
    heading: z.string().trim().min(1).max(200),
    body: z.string().trim().min(1).max(15000),
  })
  .strict();

const imageTextContentSchema = z
  .object({
    eyebrow: z.string().trim().max(120).optional(),
    heading: z.string().trim().min(1).max(200),
    body: z.string().trim().min(1).max(8000),
    mediaId: z.string().uuid().nullable().optional(),
    imageUrl: z.string().trim().max(500).nullable().optional(),
    imageAlt: z.string().trim().max(240).optional(),
    items: z
      .array(
        z
          .object({
            label: z.string().trim().min(1).max(120),
            detail: z.string().trim().min(1).max(600),
          })
          .strict(),
      )
      .max(12)
      .optional(),
  })
  .strict();

const projectGridContentSchema = z
  .object({
    eyebrow: z.string().trim().max(120).optional(),
    heading: z.string().trim().min(1).max(200),
    intro: z.string().trim().max(500).optional(),
    maxItems: z.number().int().min(1).max(12).default(4),
    featuredOnly: z.boolean().default(true),
  })
  .strict();

const servicesGridContentSchema = z
  .object({
    eyebrow: z.string().trim().max(120).optional(),
    heading: z.string().trim().min(1).max(200),
    intro: z.string().trim().max(500).optional(),
  })
  .strict();

const ctaContentSchema = z
  .object({
    eyebrow: z.string().trim().max(120).optional(),
    heading: z.string().trim().min(1).max(200),
    body: z.string().trim().max(500).optional(),
    ctaLabel: z.string().trim().min(1).max(80),
    ctaHref: z.string().trim().min(1).max(240),
    backgroundMediaId: z.string().uuid().nullable().optional(),
    backgroundUrl: z.string().trim().max(500).nullable().optional(),
  })
  .strict();

const statisticsContentSchema = z
  .object({
    heading: z.string().trim().max(200).optional(),
    items: z
      .array(
        z
          .object({
            label: z.string().trim().min(1).max(120),
            value: z.string().trim().min(1).max(60),
            note: z.string().trim().max(200).optional(),
          })
          .strict(),
      )
      .max(6),
  })
  .strict();

const galleryContentSchema = z
  .object({
    heading: z.string().trim().max(200).optional(),
    mediaIds: z.array(z.string().uuid()).max(20).default([]),
  })
  .strict();

export const sectionContentValidators: Record<SectionType, z.ZodTypeAny> = {
  [SectionType.HERO]: heroContentSchema,
  [SectionType.RICH_TEXT]: richTextContentSchema,
  [SectionType.IMAGE_TEXT]: imageTextContentSchema,
  [SectionType.PROJECT_GRID]: projectGridContentSchema,
  [SectionType.SERVICES_GRID]: servicesGridContentSchema,
  [SectionType.CTA]: ctaContentSchema,
  [SectionType.STATISTICS]: statisticsContentSchema,
  [SectionType.GALLERY]: galleryContentSchema,
};

export const pageSectionInputSchema = z
  .object({
    sectionKey: z
      .string()
      .trim()
      .min(1)
      .max(80)
      .regex(/^[a-z0-9_-]+$/i, 'Section key must be alphanumeric with dashes/underscores.'),
    type: z.nativeEnum(SectionType),
    content: z.record(z.unknown()),
    sortOrder: z.number().int().min(0).max(1000).default(0),
    isVisible: z.boolean().default(true),
  })
  .strict();

export const updatePageSchema = z
  .object({
    title: z.string().trim().min(1).max(160).optional(),
    status: z.nativeEnum(PublishStatus).optional(),
    seoTitle: z.string().trim().max(160).nullable().optional(),
    seoDescription: z.string().trim().max(320).nullable().optional(),
    sections: z.array(pageSectionInputSchema).max(20).optional(),
  })
  .strict()
  .refine((val) => Object.keys(val).length > 0, {
    message: 'At least one field must be provided for update.',
  });

export type UpdatePageInput = z.infer<typeof updatePageSchema>;
