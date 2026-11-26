import { PublishStatus, type Prisma } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { badRequest, conflict, notFound } from '../../lib/errors.js';
import { normalizeSlug, sanitizeRichText } from '../../lib/normalize.js';
import { triggerFrontendRevalidation } from '../../lib/revalidation.js';
import { recordAuditLog } from '../audit/audit.service.js';
import type { CreateServiceInput, UpdateServiceInput } from './services.schema.js';

export interface ServiceDto {
  id: string;
  title: string;
  slug: string;
  summary: string;
  description: string;
  status: PublishStatus;
  sortOrder: number;
  iconKey: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const serviceSelect = {
  id: true,
  title: true,
  slug: true,
  summary: true,
  description: true,
  status: true,
  sortOrder: true,
  iconKey: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ServiceSelect;

export async function listPublicServices(): Promise<ServiceDto[]> {
  return prisma.service.findMany({
    where: { status: PublishStatus.PUBLISHED },
    select: serviceSelect,
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
  });
}

export async function listAdminServices(): Promise<ServiceDto[]> {
  return prisma.service.findMany({
    where: { status: { not: PublishStatus.ARCHIVED } },
    select: serviceSelect,
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
  });
}

export async function createService(
  input: CreateServiceInput,
  actorUserId: string,
): Promise<ServiceDto> {
  const slug = normalizeSlug(input.slug ?? input.title);
  if (!slug) {
    throw badRequest('A valid slug could not be derived from title.');
  }

  const existing = await prisma.service.findUnique({ where: { slug }, select: { id: true } });
  if (existing) {
    throw conflict('A service with this slug already exists.', [
      { field: 'slug', message: 'Slug is already in use.' },
    ]);
  }

  const created = await prisma.$transaction(async (tx) => {
    const row = await tx.service.create({
      data: {
        title: input.title,
        slug,
        summary: input.summary,
        description: sanitizeRichText(input.description),
        status: input.status,
        sortOrder: input.sortOrder,
        iconKey: input.iconKey ?? null,
      },
      select: serviceSelect,
    });

    await recordAuditLog(
      {
        actorUserId,
        action: 'SERVICE_CREATED',
        entityType: 'Service',
        entityId: row.id,
        metadata: { slug: row.slug, status: row.status },
      },
      tx,
    );

    return row;
  });

  void triggerFrontendRevalidation(['services']);
  return created;
}

export async function updateService(
  id: string,
  input: UpdateServiceInput,
  actorUserId: string,
): Promise<ServiceDto> {
  const existing = await prisma.service.findUnique({
    where: { id },
    select: { id: true, slug: true },
  });
  if (!existing) {
    throw notFound('Service not found.');
  }

  let nextSlug: string | undefined;
  if (input.slug !== undefined) {
    nextSlug = normalizeSlug(input.slug);
    if (!nextSlug) {
      throw badRequest('Invalid slug.');
    }
    if (nextSlug !== existing.slug) {
      const collision = await prisma.service.findUnique({
        where: { slug: nextSlug },
        select: { id: true },
      });
      if (collision) {
        throw conflict('A service with this slug already exists.', [
          { field: 'slug', message: 'Slug is already in use.' },
        ]);
      }
    }
  }

  const saved = await prisma.$transaction(async (tx) => {
    const updated = await tx.service.update({
      where: { id },
      data: {
        title: input.title,
        slug: nextSlug,
        summary: input.summary,
        description:
          input.description !== undefined ? sanitizeRichText(input.description) : undefined,
        status: input.status,
        sortOrder: input.sortOrder,
        iconKey: input.iconKey,
      },
      select: serviceSelect,
    });

    await recordAuditLog(
      {
        actorUserId,
        action: 'SERVICE_UPDATED',
        entityType: 'Service',
        entityId: updated.id,
        metadata: { slug: updated.slug, status: updated.status },
      },
      tx,
    );

    return updated;
  });

  void triggerFrontendRevalidation(['services']);
  return saved;
}

export async function archiveService(id: string, actorUserId: string): Promise<void> {
  const existing = await prisma.service.findUnique({
    where: { id },
    select: { id: true, slug: true },
  });
  if (!existing) {
    throw notFound('Service not found.');
  }

  await prisma.$transaction(async (tx) => {
    await tx.service.update({
      where: { id },
      data: { status: PublishStatus.ARCHIVED },
    });

    await recordAuditLog(
      {
        actorUserId,
        action: 'SERVICE_ARCHIVED',
        entityType: 'Service',
        entityId: id,
        metadata: { slug: existing.slug },
      },
      tx,
    );
  });

  void triggerFrontendRevalidation(['services']);
}
