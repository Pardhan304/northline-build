import path from 'node:path';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { corsOptions } from './config/cors.js';
import { env } from './config/env.js';
import { httpLogger } from './config/logger.js';
import { openApiSpec } from './config/openapi.js';
import { errorHandler, notFoundHandler } from './middlewares/error-handler.js';
import { apiLimiter } from './middlewares/rate-limit.js';
import { adminAuditRouter } from './modules/audit/audit.routes.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { adminDashboardRouter } from './modules/dashboard/dashboard.routes.js';
import {
  adminEnquiriesRouter,
  publicEnquiriesRouter,
} from './modules/enquiries/enquiries.routes.js';
import { healthRouter } from './modules/health/health.routes.js';
import { adminMediaRouter } from './modules/media/media.routes.js';
import { adminPagesRouter, publicPagesRouter } from './modules/pages/pages.routes.js';
import { adminProjectsRouter, publicProjectsRouter } from './modules/projects/projects.routes.js';
import { adminServicesRouter, publicServicesRouter } from './modules/services/services.routes.js';
import { adminSettingsRouter, publicSettingsRouter } from './modules/settings/settings.routes.js';
import { adminUsersRouter } from './modules/users/users.routes.js';

export function createApp(): express.Express {
  const app = express();

  if (env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }

  app.use(httpLogger);
  app.use(helmet());
  app.use(cors(corsOptions));
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  if (env.STORAGE_PROVIDER === 'local') {
    app.use(
      '/uploads',
      (_req, res, next) => {
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        next();
      },
      express.static(path.resolve(env.LOCAL_UPLOAD_DIR)),
    );
  }

  const v1 = express.Router();
  v1.use(apiLimiter);

  v1.get('/openapi.json', (_req, res) => {
    res.status(200).json(openApiSpec);
  });

  // Public routes
  v1.use('/health', healthRouter);
  v1.use('/projects', publicProjectsRouter);
  v1.use('/pages', publicPagesRouter);
  v1.use('/services', publicServicesRouter);
  v1.use('/settings', publicSettingsRouter);
  v1.use('/enquiries', publicEnquiriesRouter);

  // Auth routes
  v1.use('/auth', authRouter);

  // Admin routes
  v1.use('/admin/dashboard', adminDashboardRouter);
  v1.use('/admin/projects', adminProjectsRouter);
  v1.use('/admin/pages', adminPagesRouter);
  v1.use('/admin/services', adminServicesRouter);
  v1.use('/admin/media', adminMediaRouter);
  v1.use('/admin/enquiries', adminEnquiriesRouter);
  v1.use('/admin/settings', adminSettingsRouter);
  v1.use('/admin/audit-logs', adminAuditRouter);
  v1.use('/admin/users', adminUsersRouter);

  app.use('/api/v1', v1);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
