import { Router } from 'express';
import { requireAuth, requireCsrf } from '../../middlewares/auth.js';
import { loginLimiter } from '../../middlewares/rate-limit.js';
import { validate } from '../../middlewares/validate.js';
import { getMe, issueCsrfToken, login, logout } from './auth.controller.js';
import { loginSchema } from './auth.schema.js';

const authRouter = Router();

authRouter.get('/csrf', issueCsrfToken);
authRouter.post('/login', loginLimiter, validate({ body: loginSchema }), login);
authRouter.post('/logout', requireAuth, requireCsrf, logout);
authRouter.get('/me', requireAuth, getMe);

export { authRouter };
