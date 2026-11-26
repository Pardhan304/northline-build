import { Role } from '@prisma/client';
import { Router, type Request, type Response } from 'express';
import { sendSuccess } from '../../lib/response.js';
import { requireAuth, requireCsrf, requireRole } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { updateSettingsSchema, type UpdateSettingsInput } from './settings.schema.js';
import { getAdminSettings, getPublicSettings, updateAdminSettings } from './settings.service.js';

export const publicSettingsRouter = Router();
publicSettingsRouter.get('/public', async (_req: Request, res: Response) => {
  const settings = await getPublicSettings();
  sendSuccess(res, {
    message: 'Public site settings fetched successfully.',
    data: settings,
  });
});

export const adminSettingsRouter = Router();
adminSettingsRouter.use(requireAuth, requireCsrf);

adminSettingsRouter.get(
  '/',
  requireRole(Role.ADMIN, Role.EDITOR),
  async (_req: Request, res: Response) => {
    const settings = await getAdminSettings();
    sendSuccess(res, {
      message: 'Admin settings fetched successfully.',
      data: settings,
    });
  },
);

adminSettingsRouter.patch(
  '/',
  requireRole(Role.ADMIN),
  validate({ body: updateSettingsSchema }),
  async (req: Request, res: Response) => {
    const body = req.validated?.body as UpdateSettingsInput;
    const updated = await updateAdminSettings(body, req.user!.id);
    sendSuccess(res, {
      message: 'Site settings updated successfully.',
      data: updated,
    });
  },
);
