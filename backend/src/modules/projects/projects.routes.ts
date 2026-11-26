import { Role } from '@prisma/client';
import { Router } from 'express';
import { requireAuth, requireCsrf, requireRole } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import {
  archiveProjectHandler,
  createProjectHandler,
  getAdminProjectHandler,
  getPublicProjectHandler,
  listAdminProjectsHandler,
  listPublicProjectsHandler,
  publishProjectHandler,
  unpublishProjectHandler,
  updateProjectHandler,
} from './projects.controller.js';
import {
  adminProjectsQuerySchema,
  createProjectSchema,
  projectIdParamSchema,
  projectSlugParamSchema,
  publicProjectsQuerySchema,
  updateProjectSchema,
} from './projects.schema.js';

export const publicProjectsRouter = Router();
publicProjectsRouter.get(
  '/',
  validate({ query: publicProjectsQuerySchema }),
  listPublicProjectsHandler,
);
publicProjectsRouter.get(
  '/:slug',
  validate({ params: projectSlugParamSchema }),
  getPublicProjectHandler,
);

export const adminProjectsRouter = Router();
adminProjectsRouter.use(requireAuth, requireRole(Role.ADMIN, Role.EDITOR), requireCsrf);

adminProjectsRouter.get(
  '/',
  validate({ query: adminProjectsQuerySchema }),
  listAdminProjectsHandler,
);
adminProjectsRouter.post('/', validate({ body: createProjectSchema }), createProjectHandler);
adminProjectsRouter.get('/:id', validate({ params: projectIdParamSchema }), getAdminProjectHandler);
adminProjectsRouter.patch(
  '/:id',
  validate({ params: projectIdParamSchema, body: updateProjectSchema }),
  updateProjectHandler,
);
adminProjectsRouter.delete(
  '/:id',
  validate({ params: projectIdParamSchema }),
  archiveProjectHandler,
);
adminProjectsRouter.post(
  '/:id/publish',
  validate({ params: projectIdParamSchema }),
  publishProjectHandler,
);
adminProjectsRouter.post(
  '/:id/unpublish',
  validate({ params: projectIdParamSchema }),
  unpublishProjectHandler,
);
