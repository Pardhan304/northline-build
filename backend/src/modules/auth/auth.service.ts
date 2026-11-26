import { prisma } from '../../config/database.js';
import { env } from '../../config/env.js';
import { generateOpaqueToken, hashToken, verifyPassword } from '../../lib/crypto.js';
import { unauthorized } from '../../lib/errors.js';
import { normalizeEmail } from '../../lib/normalize.js';
import { recordAuditLog } from '../audit/audit.service.js';
import type { AuthenticatedUser } from '../../types/express.js';
import type { LoginInput } from './auth.schema.js';

export interface LoginResult {
  user: AuthenticatedUser;
  sessionToken: string;
  expiresAt: Date;
}

export async function loginWithCredentials(
  input: LoginInput,
  meta: { ipAddress?: string | null; userAgent?: string | null },
): Promise<LoginResult> {
  const email = normalizeEmail(input.email);

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      passwordHash: true,
      role: true,
      isActive: true,
    },
  });

  // Generic failure message to reduce account enumeration
  if (!user || !user.isActive) {
    throw unauthorized('Invalid email or password.');
  }

  const passwordValid = await verifyPassword(user.passwordHash, input.password);
  if (!passwordValid) {
    throw unauthorized('Invalid email or password.');
  }

  const sessionToken = generateOpaqueToken(32);
  const tokenHash = hashToken(sessionToken);
  const expiresAt = new Date(Date.now() + env.SESSION_ABSOLUTE_TTL_DAYS * 24 * 60 * 60 * 1000);

  await prisma.$transaction(async (tx) => {
    await tx.session.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    await tx.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await recordAuditLog(
      {
        actorUserId: user.id,
        action: 'AUTH_LOGIN',
        entityType: 'Session',
        entityId: user.id,
        metadata: { email: user.email },
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      },
      tx,
    );
  });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    },
    sessionToken,
    expiresAt,
  };
}

export async function logoutSession(
  sessionId: string,
  userId: string,
  meta: { ipAddress?: string | null; userAgent?: string | null },
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.session.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });

    await recordAuditLog(
      {
        actorUserId: userId,
        action: 'AUTH_LOGOUT',
        entityType: 'Session',
        entityId: sessionId,
        metadata: {},
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      },
      tx,
    );
  });
}
