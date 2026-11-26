import type { Prisma } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { hashPassword } from '../../lib/crypto.js';
import { badRequest, conflict, forbidden, notFound } from '../../lib/errors.js';
import { normalizeEmail } from '../../lib/normalize.js';
import { recordAuditLog } from '../audit/audit.service.js';
import type { CreateUserInput, ListUsersQuery, UpdateUserInput } from './users.schema.js';

export interface SafeUserDto {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

export async function listUsers(
  query: ListUsersQuery,
): Promise<{ items: SafeUserDto[]; total: number }> {
  const where: Prisma.UserWhereInput = query.search
    ? {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          { email: { contains: query.search, mode: 'insensitive' } },
        ],
      }
    : {};

  const skip = (query.page - 1) * query.limit;
  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: safeUserSelect,
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      skip,
      take: query.limit,
    }),
    prisma.user.count({ where }),
  ]);

  return { items, total };
}

export async function createUser(
  input: CreateUserInput,
  actorUserId: string,
): Promise<SafeUserDto> {
  const email = normalizeEmail(input.email);
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    throw conflict('A user with this email already exists.', [
      { field: 'email', message: 'Email is already registered.' },
    ]);
  }

  const passwordHash = await hashPassword(input.password);

  return prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        name: input.name,
        email,
        passwordHash,
        role: input.role,
        isActive: true,
      },
      select: safeUserSelect,
    });

    await recordAuditLog(
      {
        actorUserId,
        action: 'USER_CREATED',
        entityType: 'User',
        entityId: created.id,
        metadata: { email: created.email, role: created.role },
      },
      tx,
    );

    return created;
  });
}

export async function updateUser(
  id: string,
  input: UpdateUserInput,
  actorUserId: string,
): Promise<SafeUserDto> {
  const existing = await prisma.user.findUnique({ where: { id }, select: { id: true } });
  if (!existing) {
    throw notFound('User not found.');
  }

  if (id === actorUserId && input.isActive === false) {
    throw badRequest('You cannot deactivate your own active account.');
  }

  const bootstrapLock = await prisma.auditLog.findFirst({
    where: {
      action: 'ADMIN_BOOTSTRAPPED',
      entityType: 'User',
      entityId: id,
    },
    select: { id: true },
  });
  if (bootstrapLock) {
    throw forbidden(
      'The primary bootstrapped administrator account is locked and cannot be modified.',
    );
  }

  const data: Prisma.UserUpdateInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.role !== undefined) data.role = input.role;
  if (input.isActive !== undefined) data.isActive = input.isActive;
  if (input.password !== undefined) {
    data.passwordHash = await hashPassword(input.password);
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id },
      data,
      select: safeUserSelect,
    });

    // Revoke active sessions if account is disabled or credentials/role changed
    if (input.isActive === false || input.password !== undefined || input.role !== undefined) {
      await tx.session.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    await recordAuditLog(
      {
        actorUserId,
        action: 'USER_UPDATED',
        entityType: 'User',
        entityId: updated.id,
        metadata: {
          role: updated.role,
          isActive: updated.isActive,
          passwordReset: input.password !== undefined,
        },
      },
      tx,
    );

    return updated;
  });
}
