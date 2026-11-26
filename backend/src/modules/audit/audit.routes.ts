import { Role, type Prisma } from '@prisma/client';
import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/database.js';
import { buildPaginationMeta, sendSuccess } from '../../lib/response.js';
import { requireAuth, requireRole } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';

const auditQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  entityType: z.string().trim().max(50).optional(),
  action: z.string().trim().max(60).optional(),
});

const adminAuditRouter = Router();

adminAuditRouter.get(
  '/',
  requireAuth,
  requireRole(Role.ADMIN),
  validate({ query: auditQuerySchema }),
  async (req: Request, res: Response) => {
    const query = req.validated?.query as z.infer<typeof auditQuerySchema>;
    const where: Prisma.AuditLogWhereInput = {};
    if (query.entityType) where.entityType = query.entityType;
    if (query.action) where.action = query.action;

    const skip = (query.page - 1) * query.limit;
    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        select: {
          id: true,
          action: true,
          entityType: true,
          entityId: true,
          metadata: true,
          createdAt: true,
          actor: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        skip,
        take: query.limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    sendSuccess(res, {
      message: 'Audit logs fetched successfully.',
      data: items,
      meta: buildPaginationMeta(query.page, query.limit, total),
    });
  },
);

export { adminAuditRouter };
