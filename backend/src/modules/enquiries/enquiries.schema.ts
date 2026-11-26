import { EnquiryStatus } from '@prisma/client';
import { z } from 'zod';

export const enquiryIdParamSchema = z.object({
  id: z.string().uuid('Invalid enquiry ID.'),
});

export const PROJECT_TYPES = [
  'Industrial',
  'Commercial',
  'Institutional',
  'Healthcare',
  'Hospitality',
  'Residential',
  'Other',
] as const;

export const createEnquirySchema = z
  .object({
    name: z.string().trim().min(2, 'Please enter your full name.').max(120),
    company: z.string().trim().max(160).optional().or(z.literal('')),
    email: z.string().trim().email('Please enter a valid work email address.').max(254),
    phone: z.string().trim().min(5, 'Please enter a valid phone number.').max(40),
    projectType: z.enum(PROJECT_TYPES).optional().or(z.literal('')),
    projectLocation: z.string().trim().max(160).optional().or(z.literal('')),
    projectArea: z.string().trim().max(100).optional().or(z.literal('')),
    expectedStart: z.string().trim().max(100).optional().or(z.literal('')),
    subject: z.string().trim().max(160).optional().or(z.literal('')),
    message: z
      .string()
      .trim()
      .min(10, 'Please share a brief description of your project or enquiry.')
      .max(5000),
  })
  .strict();

export const listEnquiriesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.nativeEnum(EnquiryStatus).optional(),
  search: z.string().trim().max(100).optional(),
});

export const updateEnquirySchema = z
  .object({
    status: z.nativeEnum(EnquiryStatus).optional(),
    adminNotes: z.string().trim().max(4000).nullable().optional(),
    assignedToId: z.string().uuid().nullable().optional(),
  })
  .strict()
  .refine((val) => Object.keys(val).length > 0, {
    message: 'At least one field must be provided for update.',
  });

export type CreateEnquiryInput = z.infer<typeof createEnquirySchema>;
export type ListEnquiriesQuery = z.infer<typeof listEnquiriesQuerySchema>;
export type UpdateEnquiryInput = z.infer<typeof updateEnquirySchema>;
