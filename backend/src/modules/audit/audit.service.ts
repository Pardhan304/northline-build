import type { Prisma } from '@prisma/client';
import { prisma } from '../../config/database.js';

export interface AuditInput {
  actorUserId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export async function recordAuditLog(
  input: AuditInput,
  tx: Prisma.TransactionClient = prisma,
): Promise<void> {
  await tx.auditLog.create({
    data: {
      actorUserId: input.actorUserId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      metadata: input.metadata ?? {},
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
    },
  });
}
