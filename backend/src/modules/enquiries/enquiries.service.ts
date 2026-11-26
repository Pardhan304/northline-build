import { EnquiryStatus, type Prisma } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { badRequest, notFound } from '../../lib/errors.js';
import { normalizeEmail } from '../../lib/normalize.js';
import { recordAuditLog } from '../audit/audit.service.js';
import type {
  CreateEnquiryInput,
  ListEnquiriesQuery,
  UpdateEnquiryInput,
} from './enquiries.schema.js';

export interface PublicEnquiryReceiptDto {
  id: string;
  createdAt: Date;
}

export interface AdminEnquiryDto {
  id: string;
  name: string;
  company: string | null;
  email: string;
  phone: string | null;
  projectType: string | null;
  projectLocation: string | null;
  projectArea: string | null;
  expectedStart: string | null;
  subject: string | null;
  message: string;
  status: EnquiryStatus;
  adminNotes: string | null;
  assignedTo: {
    id: string;
    name: string;
    email: string;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}

const adminEnquirySelect = {
  id: true,
  name: true,
  company: true,
  email: true,
  phone: true,
  projectType: true,
  projectLocation: true,
  projectArea: true,
  expectedStart: true,
  subject: true,
  message: true,
  status: true,
  adminNotes: true,
  assignedTo: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.EnquirySelect;

export async function submitEnquiry(input: CreateEnquiryInput): Promise<PublicEnquiryReceiptDto> {
  const derivedSubject =
    input.subject ||
    (input.projectType
      ? `${input.projectType}${input.projectLocation ? ` — ${input.projectLocation}` : ''}`
      : null);

  const created = await prisma.enquiry.create({
    data: {
      name: input.name,
      company: input.company ? input.company : null,
      email: normalizeEmail(input.email),
      phone: input.phone,
      projectType: input.projectType ? input.projectType : null,
      projectLocation: input.projectLocation ? input.projectLocation : null,
      projectArea: input.projectArea ? input.projectArea : null,
      expectedStart: input.expectedStart ? input.expectedStart : null,
      subject: derivedSubject,
      message: input.message,
      status: EnquiryStatus.NEW,
    },
    select: {
      id: true,
      createdAt: true,
    },
  });

  return created;
}

export async function listAdminEnquiries(
  query: ListEnquiriesQuery,
): Promise<{ items: AdminEnquiryDto[]; total: number }> {
  const where: Prisma.EnquiryWhereInput = {};
  if (query.status) {
    where.status = query.status;
  }
  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { email: { contains: query.search, mode: 'insensitive' } },
      { company: { contains: query.search, mode: 'insensitive' } },
      { projectType: { contains: query.search, mode: 'insensitive' } },
      { projectLocation: { contains: query.search, mode: 'insensitive' } },
      { subject: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  const skip = (query.page - 1) * query.limit;
  const [items, total] = await Promise.all([
    prisma.enquiry.findMany({
      where,
      select: adminEnquirySelect,
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      skip,
      take: query.limit,
    }),
    prisma.enquiry.count({ where }),
  ]);

  return { items, total };
}

export async function getAdminEnquiryById(id: string): Promise<AdminEnquiryDto> {
  const enquiry = await prisma.enquiry.findUnique({
    where: { id },
    select: adminEnquirySelect,
  });
  if (!enquiry) {
    throw notFound('Enquiry not found.');
  }
  return enquiry;
}

export async function updateAdminEnquiry(
  id: string,
  input: UpdateEnquiryInput,
  actorUserId: string,
): Promise<AdminEnquiryDto> {
  const existing = await prisma.enquiry.findUnique({ where: { id }, select: { id: true } });
  if (!existing) {
    throw notFound('Enquiry not found.');
  }

  if (input.assignedToId) {
    const assignee = await prisma.user.findUnique({
      where: { id: input.assignedToId },
      select: { id: true, isActive: true },
    });
    if (!assignee || !assignee.isActive) {
      throw badRequest('Assigned user does not exist or is inactive.', [
        { field: 'assignedToId', message: 'Invalid assignee.' },
      ]);
    }
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.enquiry.update({
      where: { id },
      data: {
        status: input.status,
        adminNotes: input.adminNotes,
        assignedToId: input.assignedToId,
      },
      select: adminEnquirySelect,
    });

    await recordAuditLog(
      {
        actorUserId,
        action: 'ENQUIRY_UPDATED',
        entityType: 'Enquiry',
        entityId: updated.id,
        metadata: {
          status: updated.status,
          hasNotes: Boolean(updated.adminNotes),
          assignedToId: updated.assignedTo?.id ?? null,
        },
      },
      tx,
    );

    return updated;
  });
}

export async function deleteAdminEnquiry(id: string, actorUserId: string): Promise<void> {
  const existing = await prisma.enquiry.findUnique({
    where: { id },
    select: { id: true, name: true, email: true },
  });
  if (!existing) {
    throw notFound('Enquiry not found.');
  }

  await prisma.$transaction(async (tx) => {
    await tx.enquiry.delete({ where: { id } });

    await recordAuditLog(
      {
        actorUserId,
        action: 'ENQUIRY_DELETED',
        entityType: 'Enquiry',
        entityId: id,
        metadata: {
          name: existing.name,
          email: existing.email,
        },
      },
      tx,
    );
  });
}
