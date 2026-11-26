import { PublishStatus, type Prisma } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { badRequest, conflict, notFound } from '../../lib/errors.js';
import { normalizeSlug, sanitizeRichText } from '../../lib/normalize.js';
import { triggerFrontendRevalidation } from '../../lib/revalidation.js';
import { recordAuditLog } from '../audit/audit.service.js';
import type {
  AdminProjectsQuery,
  CreateProjectInput,
  PublicProjectsQuery,
  UpdateProjectInput,
} from './projects.schema.js';

export interface ProjectMediaDto {
  mediaId: string;
  role: string;
  sortOrder: number;
  publicUrl: string | null;
  altText: string;
  width: number | null;
  height: number | null;
  variants: unknown;
}

export interface ProjectDto {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  description: string;
  category: string;
  location: string | null;
  area: string | null;
  clientName: string | null;
  completionDate: Date | null;
  status: PublishStatus;
  isFeatured: boolean;
  sortOrder: number;
  publishedAt: Date | null;
  seoTitle: string | null;
  seoDescription: string | null;
  createdAt: Date;
  updatedAt: Date;
  media: ProjectMediaDto[];
}

const projectSelect = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  description: true,
  category: true,
  location: true,
  area: true,
  clientName: true,
  completionDate: true,
  status: true,
  isFeatured: true,
  sortOrder: true,
  publishedAt: true,
  seoTitle: true,
  seoDescription: true,
  createdAt: true,
  updatedAt: true,
  media: {
    orderBy: [{ sortOrder: 'asc' }, { mediaId: 'asc' }],
    select: {
      mediaId: true,
      role: true,
      sortOrder: true,
      media: {
        select: {
          publicUrl: true,
          altText: true,
          width: true,
          height: true,
          variants: true,
        },
      },
    },
  },
} satisfies Prisma.ProjectSelect;

type SelectedProject = Prisma.ProjectGetPayload<{ select: typeof projectSelect }>;

function toProjectDto(project: SelectedProject): ProjectDto {
  return {
    id: project.id,
    title: project.title,
    slug: project.slug,
    excerpt: project.excerpt,
    description: project.description,
    category: project.category,
    location: project.location,
    area: project.area,
    clientName: project.clientName,
    completionDate: project.completionDate,
    status: project.status,
    isFeatured: project.isFeatured,
    sortOrder: project.sortOrder,
    publishedAt: project.publishedAt,
    seoTitle: project.seoTitle,
    seoDescription: project.seoDescription,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    media: project.media.map((pm) => ({
      mediaId: pm.mediaId,
      role: pm.role,
      sortOrder: pm.sortOrder,
      publicUrl: pm.media.publicUrl,
      altText: pm.media.altText,
      width: pm.media.width,
      height: pm.media.height,
      variants: pm.media.variants,
    })),
  };
}

function buildOrderBy(sort: string): Prisma.ProjectOrderByWithRelationInput[] {
  switch (sort) {
    case 'publishedAt_desc':
      return [{ publishedAt: 'desc' }, { id: 'asc' }];
    case 'sortOrder_asc':
      return [{ sortOrder: 'asc' }, { id: 'asc' }];
    case 'title_asc':
      return [{ title: 'asc' }, { id: 'asc' }];
    case 'updatedAt_desc':
    default:
      return [{ updatedAt: 'desc' }, { id: 'asc' }];
  }
}

export async function listPublicProjects(
  query: PublicProjectsQuery,
): Promise<{ items: ProjectDto[]; total: number }> {
  const where: Prisma.ProjectWhereInput = {
    status: PublishStatus.PUBLISHED,
    deletedAt: null,
    publishedAt: { lte: new Date() },
  };

  if (query.category) {
    where.category = query.category;
  }
  if (query.featured !== undefined) {
    where.isFeatured = query.featured;
  }
  if (query.search) {
    where.OR = [
      { title: { contains: query.search, mode: 'insensitive' } },
      { excerpt: { contains: query.search, mode: 'insensitive' } },
      { location: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  const skip = (query.page - 1) * query.limit;
  const [rows, total] = await Promise.all([
    prisma.project.findMany({
      where,
      select: projectSelect,
      orderBy: buildOrderBy(query.sort),
      skip,
      take: query.limit,
    }),
    prisma.project.count({ where }),
  ]);

  return { items: rows.map(toProjectDto), total };
}

export async function getPublicProjectBySlug(rawSlug: string): Promise<ProjectDto> {
  const slug = normalizeSlug(rawSlug);
  const project = await prisma.project.findFirst({
    where: {
      slug,
      status: PublishStatus.PUBLISHED,
      deletedAt: null,
      publishedAt: { lte: new Date() },
    },
    select: projectSelect,
  });

  if (!project) {
    throw notFound('Project not found.');
  }

  return toProjectDto(project);
}

export async function listAdminProjects(
  query: AdminProjectsQuery,
): Promise<{ items: ProjectDto[]; total: number }> {
  const where: Prisma.ProjectWhereInput = {
    deletedAt: null,
  };
  if (query.status) {
    where.status = query.status;
  }
  if (query.category) {
    where.category = query.category;
  }
  if (query.search) {
    where.OR = [
      { title: { contains: query.search, mode: 'insensitive' } },
      { slug: { contains: query.search, mode: 'insensitive' } },
      { location: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  const skip = (query.page - 1) * query.limit;
  const [rows, total] = await Promise.all([
    prisma.project.findMany({
      where,
      select: projectSelect,
      orderBy: buildOrderBy(query.sort),
      skip,
      take: query.limit,
    }),
    prisma.project.count({ where }),
  ]);

  return { items: rows.map(toProjectDto), total };
}

export async function getAdminProjectById(id: string): Promise<ProjectDto> {
  const project = await prisma.project.findFirst({
    where: { id, deletedAt: null },
    select: projectSelect,
  });

  if (!project) {
    throw notFound('Project not found.');
  }

  return toProjectDto(project);
}

async function assertValidMediaIds(
  tx: Prisma.TransactionClient,
  mediaIds: string[],
): Promise<void> {
  if (mediaIds.length === 0) return;
  const uniqueIds = [...new Set(mediaIds)];
  const count = await tx.media.count({
    where: {
      id: { in: uniqueIds },
      deletedAt: null,
    },
  });
  if (count !== uniqueIds.length) {
    throw badRequest('One or more selected media items do not exist.', [
      { field: 'media', message: 'Invalid or deleted media reference.' },
    ]);
  }
}

export async function createProject(
  input: CreateProjectInput,
  actorUserId: string,
): Promise<ProjectDto> {
  const slug = normalizeSlug(input.slug ?? input.title);
  if (!slug) {
    throw badRequest('A valid slug could not be derived from the title.', [
      { field: 'slug', message: 'Provide a valid URL slug.' },
    ]);
  }

  const existing = await prisma.project.findUnique({ where: { slug }, select: { id: true } });
  if (existing) {
    throw conflict('A project with this slug already exists.', [
      { field: 'slug', message: 'Slug is already in use.' },
    ]);
  }

  const created = await prisma.$transaction(async (tx) => {
    if (input.media?.length) {
      await assertValidMediaIds(
        tx,
        input.media.map((m) => m.mediaId),
      );
    }

    const row = await tx.project.create({
      data: {
        title: input.title,
        slug,
        excerpt: input.excerpt,
        description: sanitizeRichText(input.description),
        category: input.category,
        location: input.location ?? null,
        area: input.area ?? null,
        clientName: input.clientName ?? null,
        completionDate: input.completionDate ?? null,
        status: PublishStatus.DRAFT,
        isFeatured: input.isFeatured,
        sortOrder: input.sortOrder,
        seoTitle: input.seoTitle ?? null,
        seoDescription: input.seoDescription ?? null,
        createdById: actorUserId,
        updatedById: actorUserId,
        media: input.media?.length
          ? {
              create: input.media.map((m) => ({
                mediaId: m.mediaId,
                role: m.role,
                sortOrder: m.sortOrder,
              })),
            }
          : undefined,
      },
      select: projectSelect,
    });

    await recordAuditLog(
      {
        actorUserId,
        action: 'PROJECT_CREATED',
        entityType: 'Project',
        entityId: row.id,
        metadata: { title: row.title, slug: row.slug },
      },
      tx,
    );

    return row;
  });

  return toProjectDto(created);
}

export async function updateProject(
  id: string,
  input: UpdateProjectInput,
  actorUserId: string,
): Promise<ProjectDto> {
  const existing = await prisma.project.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, slug: true },
  });
  if (!existing) {
    throw notFound('Project not found.');
  }

  let nextSlug: string | undefined;
  if (input.slug !== undefined) {
    nextSlug = normalizeSlug(input.slug);
    if (!nextSlug) {
      throw badRequest('Invalid slug format.', [
        { field: 'slug', message: 'Provide a valid URL slug.' },
      ]);
    }
    if (nextSlug !== existing.slug) {
      const collision = await prisma.project.findUnique({
        where: { slug: nextSlug },
        select: { id: true },
      });
      if (collision) {
        throw conflict('A project with this slug already exists.', [
          { field: 'slug', message: 'Slug is already in use.' },
        ]);
      }
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (input.media !== undefined) {
      await assertValidMediaIds(
        tx,
        input.media.map((m) => m.mediaId),
      );
      await tx.projectMedia.deleteMany({ where: { projectId: id } });
    }

    const row = await tx.project.update({
      where: { id },
      data: {
        title: input.title,
        slug: nextSlug,
        excerpt: input.excerpt,
        description:
          input.description !== undefined ? sanitizeRichText(input.description) : undefined,
        category: input.category,
        location: input.location,
        area: input.area,
        clientName: input.clientName,
        completionDate: input.completionDate,
        isFeatured: input.isFeatured,
        sortOrder: input.sortOrder,
        seoTitle: input.seoTitle,
        seoDescription: input.seoDescription,
        updatedById: actorUserId,
        media:
          input.media !== undefined
            ? {
                create: input.media.map((m) => ({
                  mediaId: m.mediaId,
                  role: m.role,
                  sortOrder: m.sortOrder,
                })),
              }
            : undefined,
      },
      select: projectSelect,
    });

    await recordAuditLog(
      {
        actorUserId,
        action: 'PROJECT_UPDATED',
        entityType: 'Project',
        entityId: row.id,
        metadata: { title: row.title, slug: row.slug },
      },
      tx,
    );

    return row;
  });

  void triggerFrontendRevalidation(['projects', `project:${updated.slug}`]);
  return toProjectDto(updated);
}

export async function publishProject(id: string, actorUserId: string): Promise<ProjectDto> {
  const existing = await prisma.project.findFirst({
    where: { id, deletedAt: null },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      description: true,
      category: true,
      publishedAt: true,
    },
  });
  if (!existing) {
    throw notFound('Project not found.');
  }

  const missing: Array<{ field: string; message: string }> = [];
  if (!existing.title.trim())
    missing.push({ field: 'title', message: 'Title is required to publish.' });
  if (!existing.slug.trim())
    missing.push({ field: 'slug', message: 'Slug is required to publish.' });
  if (!existing.excerpt.trim())
    missing.push({ field: 'excerpt', message: 'Excerpt is required to publish.' });
  if (!existing.description.trim()) {
    missing.push({ field: 'description', message: 'Description is required to publish.' });
  }
  if (!existing.category.trim()) {
    missing.push({ field: 'category', message: 'Category is required to publish.' });
  }

  if (missing.length > 0) {
    throw badRequest('Project is missing required fields before publishing.', missing);
  }

  const published = await prisma.$transaction(async (tx) => {
    const row = await tx.project.update({
      where: { id },
      data: {
        status: PublishStatus.PUBLISHED,
        publishedAt: existing.publishedAt ?? new Date(),
        updatedById: actorUserId,
      },
      select: projectSelect,
    });

    await recordAuditLog(
      {
        actorUserId,
        action: 'PROJECT_PUBLISHED',
        entityType: 'Project',
        entityId: row.id,
        metadata: { slug: row.slug },
      },
      tx,
    );

    return row;
  });

  void triggerFrontendRevalidation(['projects', `project:${published.slug}`]);
  return toProjectDto(published);
}

export async function unpublishProject(id: string, actorUserId: string): Promise<ProjectDto> {
  const existing = await prisma.project.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, slug: true },
  });
  if (!existing) {
    throw notFound('Project not found.');
  }

  const unpublished = await prisma.$transaction(async (tx) => {
    const row = await tx.project.update({
      where: { id },
      data: {
        status: PublishStatus.DRAFT,
        updatedById: actorUserId,
      },
      select: projectSelect,
    });

    await recordAuditLog(
      {
        actorUserId,
        action: 'PROJECT_UNPUBLISHED',
        entityType: 'Project',
        entityId: row.id,
        metadata: { slug: row.slug },
      },
      tx,
    );

    return row;
  });

  void triggerFrontendRevalidation(['projects', `project:${unpublished.slug}`]);
  return toProjectDto(unpublished);
}

export async function archiveProject(id: string, actorUserId: string): Promise<void> {
  const existing = await prisma.project.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, slug: true },
  });
  if (!existing) {
    throw notFound('Project not found.');
  }

  await prisma.$transaction(async (tx) => {
    await tx.project.update({
      where: { id },
      data: {
        status: PublishStatus.ARCHIVED,
        deletedAt: new Date(),
        updatedById: actorUserId,
      },
    });

    await recordAuditLog(
      {
        actorUserId,
        action: 'PROJECT_ARCHIVED',
        entityType: 'Project',
        entityId: id,
        metadata: { slug: existing.slug },
      },
      tx,
    );
  });

  void triggerFrontendRevalidation(['projects', `project:${existing.slug}`]);
}
