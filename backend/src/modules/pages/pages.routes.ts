import { Role } from '@prisma/client';
import { Router } from 'express';
import { requireAuth, requireCsrf, requireRole } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import {
  getAdminPageHandler,
  getPublicPageHandler,
  listAdminPagesHandler,
  updateAdminPageHandler,
} from './pages.controller.js';
import { pageSlugParamSchema, updatePageSchema } from './pages.schema.js';

export const publicPagesRouter = Router();
publicPagesRouter.get('/:slug', validate({ params: pageSlugParamSchema }), getPublicPageHandler);

export const adminPagesRouter = Router();
adminPagesRouter.use(requireAuth, requireRole(Role.ADMIN, Role.EDITOR), requireCsrf);

adminPagesRouter.get('/', listAdminPagesHandler);
adminPagesRouter.get('/:slug', validate({ params: pageSlugParamSchema }), getAdminPageHandler);
adminPagesRouter.patch(
  '/:slug',
  validate({ params: pageSlugParamSchema, body: updatePageSchema }),
  updateAdminPageHandler,
);
