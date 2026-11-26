import type { Prisma } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { triggerFrontendRevalidation } from '../../lib/revalidation.js';
import { recordAuditLog } from '../audit/audit.service.js';
import { PUBLIC_SETTING_KEYS, type UpdateSettingsInput } from './settings.schema.js';

export type PublicSettingsMap = Record<string, unknown>;

export async function getPublicSettings(): Promise<PublicSettingsMap> {
  const rows = await prisma.siteSetting.findMany({
    where: { key: { in: [...PUBLIC_SETTING_KEYS] } },
    select: { key: true, value: true },
  });

  const result: PublicSettingsMap = {};
  for (const row of rows) {
    result[row.key] = row.value;
  }
  return result;
}

export async function getAdminSettings(): Promise<PublicSettingsMap> {
  const rows = await prisma.siteSetting.findMany({
    select: { key: true, value: true, updatedAt: true },
    orderBy: { key: 'asc' },
  });

  const result: PublicSettingsMap = {};
  for (const row of rows) {
    result[row.key] = row.value;
  }
  return result;
}

export async function updateAdminSettings(
  input: UpdateSettingsInput,
  actorUserId: string,
): Promise<PublicSettingsMap> {
  const entries = Object.entries(input).filter(([, value]) => value !== undefined);

  await prisma.$transaction(async (tx) => {
    for (const [key, value] of entries) {
      await tx.siteSetting.upsert({
        where: { key },
        create: {
          key,
          value: value as Prisma.InputJsonValue,
          updatedById: actorUserId,
        },
        update: {
          value: value as Prisma.InputJsonValue,
          updatedById: actorUserId,
        },
      });
    }

    await recordAuditLog(
      {
        actorUserId,
        action: 'SETTINGS_UPDATED',
        entityType: 'SiteSetting',
        entityId: entries.map(([key]) => key).join(','),
        metadata: { updatedKeys: entries.map(([key]) => key) },
      },
      tx,
    );
  });

  void triggerFrontendRevalidation(['settings']);
  return getAdminSettings();
}
