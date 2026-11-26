import crypto from 'node:crypto';
import type { Prisma } from '@prisma/client';
import sharp from 'sharp';
import { prisma } from '../../config/database.js';
import { storageAdapter } from '../../config/storage.js';
import {
  badRequest,
  conflict,
  notFound,
  payloadTooLarge,
  unsupportedMediaType,
} from '../../lib/errors.js';
import { recordAuditLog } from '../audit/audit.service.js';
import type { ListMediaQuery, UpdateMediaInput } from './media.schema.js';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_PIXEL_COUNT = 40_000_000; // 40 MP decompression-bomb guard

type AllowedImageMime = 'image/jpeg' | 'image/png' | 'image/webp';

export interface MediaVariantInfo {
  key: string;
  url: string;
  width: number;
  height: number;
  sizeBytes: number;
}

export interface MediaDto {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  altText: string;
  storageProvider: string;
  publicUrl: string | null;
  variants: unknown;
  createdAt: Date;
  updatedAt: Date;
}

const mediaSelect = {
  id: true,
  originalName: true,
  mimeType: true,
  sizeBytes: true,
  width: true,
  height: true,
  altText: true,
  storageProvider: true,
  publicUrl: true,
  variants: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.MediaSelect;

export function detectImageSignature(buffer: Buffer): AllowedImageMime | null {
  if (buffer.length < 12) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png';
  }

  // WebP: RIFF....WEBP
  if (
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'image/webp';
  }

  return null;
}

const VARIANT_TARGETS: ReadonlyArray<{ name: string; width: number; quality: number }> = [
  { name: 'thumbnail', width: 400, quality: 78 },
  { name: 'card', width: 800, quality: 82 },
  { name: 'hero', width: 1600, quality: 84 },
];

export async function uploadImageMedia(
  file: Express.Multer.File | undefined,
  altText: string,
  actorUserId: string,
): Promise<MediaDto> {
  if (!file) {
    throw badRequest('An image file is required.');
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw payloadTooLarge('Image exceeds the 10 MB limit.');
  }

  const detectedMime = detectImageSignature(file.buffer);
  if (!detectedMime) {
    throw unsupportedMediaType('Only valid JPEG, PNG, and WebP images are permitted.');
  }

  let metadata: sharp.Metadata;
  try {
    metadata = await sharp(file.buffer, { limitInputPixels: MAX_PIXEL_COUNT }).metadata();
  } catch {
    throw badRequest('Uploaded file could not be processed as a valid image.');
  }

  if (!metadata.width || !metadata.height) {
    throw badRequest('Image dimensions could not be verified.');
  }

  if (metadata.width * metadata.height > MAX_PIXEL_COUNT) {
    throw payloadTooLarge('Image pixel dimensions exceed maximum allowed resolution.');
  }

  const assetId = crypto.randomUUID();
  const baseKey = `media/${assetId}`;
  const uploadedKeys: string[] = [];

  try {
    // Strip EXIF/GPS and encode normalized primary WebP
    const primaryProcessed = await sharp(file.buffer, { limitInputPixels: MAX_PIXEL_COUNT })
      .rotate()
      .webp({ quality: 85 })
      .toBuffer({ resolveWithObject: true });

    const primaryKey = `${baseKey}/primary.webp`;
    const primaryUpload = await storageAdapter.upload(primaryProcessed.data, primaryKey, {
      contentType: 'image/webp',
    });
    uploadedKeys.push(primaryKey);

    const variants: Record<string, MediaVariantInfo> = {};
    for (const target of VARIANT_TARGETS) {
      const resized = await sharp(file.buffer, { limitInputPixels: MAX_PIXEL_COUNT })
        .rotate()
        .resize({ width: target.width, withoutEnlargement: true })
        .webp({ quality: target.quality })
        .toBuffer({ resolveWithObject: true });

      const variantKey = `${baseKey}/${target.name}.webp`;
      const variantUpload = await storageAdapter.upload(resized.data, variantKey, {
        contentType: 'image/webp',
      });
      uploadedKeys.push(variantKey);

      variants[target.name] = {
        key: variantKey,
        url: variantUpload.publicUrl,
        width: resized.info.width,
        height: resized.info.height,
        sizeBytes: resized.info.size,
      };
    }

    const created = await prisma.$transaction(async (tx) => {
      const record = await tx.media.create({
        data: {
          originalName: file.originalname.slice(0, 200),
          mimeType: 'image/webp',
          sizeBytes: primaryProcessed.info.size,
          width: primaryProcessed.info.width,
          height: primaryProcessed.info.height,
          altText: altText.trim().slice(0, 240),
          storageProvider: storageAdapter.providerName,
          storageKey: primaryKey,
          publicUrl: primaryUpload.publicUrl,
          variants: variants as unknown as Prisma.InputJsonValue,
          uploadedById: actorUserId,
        },
        select: mediaSelect,
      });

      await recordAuditLog(
        {
          actorUserId,
          action: 'MEDIA_UPLOADED',
          entityType: 'Media',
          entityId: record.id,
          metadata: {
            originalName: record.originalName,
            detectedSourceMime: detectedMime,
            width: record.width,
            height: record.height,
          },
        },
        tx,
      );

      return record;
    });

    return created;
  } catch (err) {
    await Promise.allSettled(uploadedKeys.map((key) => storageAdapter.delete(key)));
    throw err;
  }
}

export async function listMedia(
  query: ListMediaQuery,
): Promise<{ items: MediaDto[]; total: number }> {
  const where: Prisma.MediaWhereInput = { deletedAt: null };
  if (query.mimeType) {
    where.mimeType = query.mimeType;
  }
  if (query.search) {
    where.OR = [
      { originalName: { contains: query.search, mode: 'insensitive' } },
      { altText: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  const skip = (query.page - 1) * query.limit;
  const [items, total] = await Promise.all([
    prisma.media.findMany({
      where,
      select: mediaSelect,
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      skip,
      take: query.limit,
    }),
    prisma.media.count({ where }),
  ]);

  return { items, total };
}

export async function updateMediaAltText(
  id: string,
  input: UpdateMediaInput,
  actorUserId: string,
): Promise<MediaDto> {
  const existing = await prisma.media.findFirst({
    where: { id, deletedAt: null },
    select: { id: true },
  });
  if (!existing) {
    throw notFound('Media item not found.');
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.media.update({
      where: { id },
      data: { altText: input.altText },
      select: mediaSelect,
    });

    await recordAuditLog(
      {
        actorUserId,
        action: 'MEDIA_UPDATED',
        entityType: 'Media',
        entityId: id,
        metadata: { altText: updated.altText },
      },
      tx,
    );

    return updated;
  });
}

export async function deleteMedia(id: string, actorUserId: string): Promise<void> {
  const media = await prisma.media.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, storageKey: true, variants: true, originalName: true },
  });

  if (!media) {
    throw notFound('Media item not found.');
  }

  const [projectRefCount, sections] = await Promise.all([
    prisma.projectMedia.count({ where: { mediaId: id } }),
    prisma.pageSection.findMany({ select: { id: true, content: true } }),
  ]);

  if (projectRefCount > 0) {
    throw conflict(
      'This media asset is currently attached to one or more projects. Detach it before deleting.',
    );
  }

  const referencedInPage = sections.some((sec) => JSON.stringify(sec.content).includes(id));
  if (referencedInPage) {
    throw conflict(
      'This media asset is referenced in a page section. Remove the reference before deleting.',
    );
  }

  const keysToDelete: string[] = [media.storageKey];
  if (media.variants && typeof media.variants === 'object') {
    for (const val of Object.values(media.variants as Record<string, { key?: string }>)) {
      if (val && typeof val.key === 'string') {
        keysToDelete.push(val.key);
      }
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.media.delete({ where: { id } });
    await recordAuditLog(
      {
        actorUserId,
        action: 'MEDIA_DELETED',
        entityType: 'Media',
        entityId: id,
        metadata: { originalName: media.originalName },
      },
      tx,
    );
  });

  await Promise.allSettled(keysToDelete.map((key) => storageAdapter.delete(key)));
}
