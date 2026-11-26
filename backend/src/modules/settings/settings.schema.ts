import { z } from 'zod';

export const PUBLIC_SETTING_KEYS = ['general', 'contact', 'social', 'seo'] as const;

export const generalSettingSchema = z
  .object({
    companyName: z.string().trim().min(1).max(160),
    tagline: z.string().trim().max(240).default(''),
    footerStatement: z.string().trim().max(400).default(''),
  })
  .strict();

export const contactSettingSchema = z
  .object({
    email: z.string().trim().email().max(254).or(z.literal('')).default(''),
    phone: z.string().trim().max(40).default(''),
    address: z.string().trim().max(300).default(''),
    businessHours: z.string().trim().max(200).default(''),
  })
  .strict();

export const socialSettingSchema = z
  .object({
    linkedinUrl: z.string().trim().url().max(300).or(z.literal('')).default(''),
    instagramUrl: z.string().trim().url().max(300).or(z.literal('')).default(''),
  })
  .strict();

export const seoSettingSchema = z
  .object({
    defaultTitle: z.string().trim().min(1).max(160),
    defaultDescription: z.string().trim().max(320).default(''),
  })
  .strict();

export const updateSettingsSchema = z
  .object({
    general: generalSettingSchema.optional(),
    contact: contactSettingSchema.optional(),
    social: socialSettingSchema.optional(),
    seo: seoSettingSchema.optional(),
  })
  .strict()
  .refine((val) => Object.keys(val).length > 0, {
    message: 'At least one settings group must be provided.',
  });

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
