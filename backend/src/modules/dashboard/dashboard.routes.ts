import { EnquiryStatus, PublishStatus, Role } from '@prisma/client';
import { Router, type Request, type Response } from 'express';
import { prisma } from '../../config/database.js';
import { sendSuccess } from '../../lib/response.js';
import { requireAuth, requireRole } from '../../middlewares/auth.js';

export const adminDashboardRouter = Router();

adminDashboardRouter.get(
  '/',
  requireAuth,
  requireRole(Role.ADMIN, Role.EDITOR),
  async (_req: Request, res: Response) => {
    const [
      publishedProjects,
      draftProjects,
      newEnquiries,
      totalEnquiries,
      totalMedia,
      publishedServices,
      recentEnquiries,
      recentProjects,
    ] = await Promise.all([
      prisma.project.count({
        where: { status: PublishStatus.PUBLISHED, deletedAt: null },
      }),
      prisma.project.count({
        where: { status: PublishStatus.DRAFT, deletedAt: null },
      }),
      prisma.enquiry.count({ where: { status: EnquiryStatus.NEW } }),
      prisma.enquiry.count(),
      prisma.media.count({ where: { deletedAt: null } }),
      prisma.service.count({ where: { status: PublishStatus.PUBLISHED } }),
      prisma.enquiry.findMany({
        take: 5,
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        select: {
          id: true,
          name: true,
          email: true,
          subject: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.project.findMany({
        where: { deletedAt: null },
        take: 5,
        orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          updatedAt: true,
        },
      }),
    ]);

    sendSuccess(res, {
      message: 'Dashboard summary fetched successfully.',
      data: {
        counts: {
          publishedProjects,
          draftProjects,
          newEnquiries,
          totalEnquiries,
          totalMedia,
          publishedServices,
        },
        recentEnquiries,
        recentProjects,
      },
    });
  },
);
