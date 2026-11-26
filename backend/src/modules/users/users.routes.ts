import { Role } from '@prisma/client';
import { Router } from 'express';
import { requireAuth, requireCsrf, requireRole } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { createUserHandler, getUsersHandler, updateUserHandler } from './users.controller.js';
import {
  createUserSchema,
  listUsersQuerySchema,
  updateUserSchema,
  userIdParamSchema,
} from './users.schema.js';

const adminUsersRouter = Router();

adminUsersRouter.use(requireAuth, requireRole(Role.ADMIN), requireCsrf);

adminUsersRouter.get('/', validate({ query: listUsersQuerySchema }), getUsersHandler);
adminUsersRouter.post('/', validate({ body: createUserSchema }), createUserHandler);
adminUsersRouter.patch(
  '/:id',
  validate({ params: userIdParamSchema, body: updateUserSchema }),
  updateUserHandler,
);

export { adminUsersRouter };
