import { PublishStatus, SectionType, type Prisma } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { badRequest, notFound } from '../../lib/errors.js';
import { normalizeSlug, sanitizeRichText } from '../../lib/normalize.js';
import { triggerFrontendRevalidation } from '../../lib/revalidation.js';
import { recordAuditLog } from '../audit/audit.service.js';
import { sectionContentValidators, type UpdatePageInput } from './pages.schema.js';

export interface PageSectionDto {
  id: string;
  sectionKey: string;
  type: string;
  content: unknown;
  sortOrder: number;
  isVisible: boolean;
}

export interface PageDto {
  id: string;
  slug: string;
  title: string;
  status: PublishStatus;
  seoTitle: string | null;
  seoDescription: string | null;
  publishedAt: Date | null;
  updatedAt: Date;
  sections: PageSectionDto[];
}

const pageSelect = {
  id: true,
  slug: true,
  title: true,
  status: true,
  seoTitle: true,
  seoDescription: true,
  publishedAt: true,
  updatedAt: true,
  sections: {
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    select: {
      id: true,
      sectionKey: true,
      type: true,
      content: true,
      sortOrder: true,
      isVisible: true,
    },
  },
} satisfies Prisma.PageSelect;

function sanitizeSectionContent(content: Record<string, unknown>): Prisma.InputJsonValue {
  const result: Record<string, unknown> = { ...content };
  if (typeof result.body === 'string') {
    result.body = sanitizeRichText(result.body);
  }
  return result as Prisma.InputJsonValue;
}

export async function getPublicPageBySlug(rawSlug: string): Promise<PageDto> {
  const slug = normalizeSlug(rawSlug);
  const page = await prisma.page.findFirst({
    where: {
      slug,
      status: PublishStatus.PUBLISHED,
      publishedAt: { lte: new Date() },
    },
    select: {
      ...pageSelect,
      sections: {
        where: { isVisible: true },
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
        select: pageSelect.sections.select,
      },
    },
  });

  if (!page) {
    throw notFound('Page not found.');
  }

  return page;
}

export async function listAdminPages(): Promise<PageDto[]> {
  return prisma.page.findMany({
    select: pageSelect,
    orderBy: [{ slug: 'asc' }],
  });
}

export async function getAdminPageBySlug(rawSlug: string): Promise<PageDto> {
  const slug = normalizeSlug(rawSlug);
  const page = await prisma.page.findUnique({
    where: { slug },
    select: pageSelect,
  });
  if (!page) {
    throw notFound('Page not found.');
  }
  return page;
}

export async function updateAdminPage(
  rawSlug: string,
  input: UpdatePageInput,
  actorUserId: string,
): Promise<PageDto> {
  const slug = normalizeSlug(rawSlug);
  const existing = await prisma.page.findUnique({
    where: { slug },
    select: { id: true, title: true, publishedAt: true },
  });
  if (!existing) {
    throw notFound('Page not found.');
  }

  const validatedSections: Array<{
    sectionKey: string;
    type: SectionType;
    content: Prisma.InputJsonValue;
    sortOrder: number;
    isVisible: boolean;
  }> = [];

  if (input.sections) {
    const seenKeys = new Set<string>();
    for (const sec of input.sections) {
      if (seenKeys.has(sec.sectionKey)) {
        throw badRequest(`Duplicate section key "${sec.sectionKey}".`, [
          { field: 'sections', message: `Section key "${sec.sectionKey}" must be unique.` },
        ]);
      }
      seenKeys.add(sec.sectionKey);

      const schema = sectionContentValidators[sec.type];
      const parsed = schema.safeParse(sec.content);
      if (!parsed.success) {
        throw badRequest(
          `Invalid content for section "${sec.sectionKey}" (${sec.type}).`,
          parsed.error.issues.map((issue) => ({
            field: `sections.${sec.sectionKey}.${issue.path.join('.')}`,
            message: issue.message,
          })),
        );
      }

      validatedSections.push({
        sectionKey: sec.sectionKey,
        type: sec.type,
        content: sanitizeSectionContent(parsed.data as Record<string, unknown>),
        sortOrder: sec.sortOrder,
        isVisible: sec.isVisible,
      });
    }
  }

  const saved = await prisma.$transaction(async (tx) => {
    if (input.sections) {
      await tx.pageSection.deleteMany({ where: { pageId: existing.id } });
    }

    const updated = await tx.page.update({
      where: { id: existing.id },
      data: {
        title: input.title,
        status: input.status,
        seoTitle: input.seoTitle,
        seoDescription: input.seoDescription,
        publishedAt:
          input.status === PublishStatus.PUBLISHED
            ? (existing.publishedAt ?? new Date())
            : undefined,
        sections: input.sections
          ? {
              create: validatedSections,
            }
          : undefined,
      },
      select: pageSelect,
    });

    await recordAuditLog(
      {
        actorUserId,
        action: 'PAGE_UPDATED',
        entityType: 'Page',
        entityId: updated.id,
        metadata: { slug: updated.slug, status: updated.status },
      },
      tx,
    );

    return updated;
  });

  void triggerFrontendRevalidation(['pages', `page:${saved.slug}`]);
  return saved;
}
