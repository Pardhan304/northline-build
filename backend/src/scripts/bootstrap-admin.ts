import 'dotenv/config';
import { Role } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { hashPassword } from '../lib/crypto.js';
import { normalizeEmail } from '../lib/normalize.js';
import { recordAuditLog } from '../modules/audit/audit.service.js';

const bootstrapSchema = z.object({
  ADMIN_NAME: z.string().trim().min(2).max(120).default('Northline Administrator'),
  ADMIN_EMAIL: z.string().trim().email().max(254),
  ADMIN_PASSWORD: z.string().min(10, 'ADMIN_PASSWORD must be at least 10 characters.').max(200),
});

async function run(): Promise<void> {
  const parsed = bootstrapSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Invalid bootstrap environment variables: ${issues}`);
  }

  const email = normalizeEmail(parsed.data.ADMIN_EMAIL);

  const existingAdminCount = await prisma.user.count({
    where: { role: Role.ADMIN },
  });

  if (existingAdminCount > 0) {
    throw new Error(
      'An administrator account already exists. Bootstrap refuses to overwrite existing admins.',
    );
  }

  const existingEmail = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existingEmail) {
    throw new Error(`A user with email ${email} already exists.`);
  }

  const passwordHash = await hashPassword(parsed.data.ADMIN_PASSWORD);

  const admin = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: parsed.data.ADMIN_NAME,
        email,
        passwordHash,
        role: Role.ADMIN,
        isActive: true,
      },
      select: { id: true, email: true, role: true },
    });

    await recordAuditLog(
      {
        actorUserId: null,
        action: 'ADMIN_BOOTSTRAPPED',
        entityType: 'User',
        entityId: user.id,
        metadata: { email: user.email },
      },
      tx,
    );

    return user;
  });

  console.log(`Administrator created: ${admin.email} (${admin.id})`);
}

run()
  .catch((err) => {
    console.error('Bootstrap failed:', err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
