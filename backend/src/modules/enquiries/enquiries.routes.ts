import { Role } from '@prisma/client';
import { Router } from 'express';
import { requireAuth, requireCsrf, requireRole } from '../../middlewares/auth.js';
import { enquiryLimiter } from '../../middlewares/rate-limit.js';
import { validate } from '../../middlewares/validate.js';
import {
  deleteAdminEnquiryHandler,
  getAdminEnquiryHandler,
  listAdminEnquiriesHandler,
  submitEnquiryHandler,
  updateAdminEnquiryHandler,
} from './enquiries.controller.js';
import {
  createEnquirySchema,
  enquiryIdParamSchema,
  listEnquiriesQuerySchema,
  updateEnquirySchema,
} from './enquiries.schema.js';

export const publicEnquiriesRouter = Router();
publicEnquiriesRouter.post(
  '/',
  enquiryLimiter,
  validate({ body: createEnquirySchema }),
  submitEnquiryHandler,
);

export const adminEnquiriesRouter = Router();
adminEnquiriesRouter.use(requireAuth, requireRole(Role.ADMIN, Role.EDITOR), requireCsrf);

adminEnquiriesRouter.get(
  '/',
  validate({ query: listEnquiriesQuerySchema }),
  listAdminEnquiriesHandler,
);
adminEnquiriesRouter.get(
  '/:id',
  validate({ params: enquiryIdParamSchema }),
  getAdminEnquiryHandler,
);
adminEnquiriesRouter.patch(
  '/:id',
  validate({ params: enquiryIdParamSchema, body: updateEnquirySchema }),
  updateAdminEnquiryHandler,
);
adminEnquiriesRouter.delete(
  '/:id',
  validate({ params: enquiryIdParamSchema }),
  deleteAdminEnquiryHandler,
);
