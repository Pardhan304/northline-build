import { Role } from '@prisma/client';
import { Router } from 'express';
import { requireAuth, requireCsrf, requireRole } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import {
  archiveServiceHandler,
  createServiceHandler,
  listAdminServicesHandler,
  listPublicServicesHandler,
  updateServiceHandler,
} from './services.controller.js';
import {
  createServiceSchema,
  serviceIdParamSchema,
  updateServiceSchema,
} from './services.schema.js';

export const publicServicesRouter = Router();
publicServicesRouter.get('/', listPublicServicesHandler);

export const adminServicesRouter = Router();
adminServicesRouter.use(requireAuth, requireRole(Role.ADMIN, Role.EDITOR), requireCsrf);

adminServicesRouter.get('/', listAdminServicesHandler);
adminServicesRouter.post('/', validate({ body: createServiceSchema }), createServiceHandler);
adminServicesRouter.patch(
  '/:id',
  validate({ params: serviceIdParamSchema, body: updateServiceSchema }),
  updateServiceHandler,
);
adminServicesRouter.delete(
  '/:id',
  validate({ params: serviceIdParamSchema }),
  archiveServiceHandler,
);
