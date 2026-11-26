import { Role } from '@prisma/client';
import { Router } from 'express';
import multer from 'multer';
import { requireAuth, requireCsrf, requireRole } from '../../middlewares/auth.js';
import { uploadLimiter } from '../../middlewares/rate-limit.js';
import { validate } from '../../middlewares/validate.js';
import {
  deleteMediaHandler,
  listMediaHandler,
  updateMediaHandler,
  uploadMediaHandler,
} from './media.controller.js';
import { listMediaQuerySchema, mediaIdParamSchema, updateMediaSchema } from './media.schema.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 1,
  },
});

export const adminMediaRouter = Router();
adminMediaRouter.use(requireAuth, requireRole(Role.ADMIN, Role.EDITOR), requireCsrf);

adminMediaRouter.get('/', validate({ query: listMediaQuerySchema }), listMediaHandler);
adminMediaRouter.post('/', uploadLimiter, upload.single('file'), uploadMediaHandler);
adminMediaRouter.patch(
  '/:id',
  validate({ params: mediaIdParamSchema, body: updateMediaSchema }),
  updateMediaHandler,
);
adminMediaRouter.delete('/:id', validate({ params: mediaIdParamSchema }), deleteMediaHandler);
