import { Router, type Request, type Response } from 'express';
import { prisma } from '../../config/database.js';
import { env } from '../../config/env.js';

export const healthRouter = Router();

healthRouter.get('/', async (_req: Request, res: Response) => {
  let dbStatus: 'connected' | 'unavailable' = 'unavailable';

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch {
    dbStatus = 'unavailable';
  }

  const healthy = dbStatus === 'connected';
  res.status(healthy ? 200 : 503).json({
    success: healthy,
    message: healthy ? 'Service is healthy and ready.' : 'Database readiness check failed.',
    data: {
      status: healthy ? 'ok' : 'degraded',
      environment: env.NODE_ENV,
      database: dbStatus,
    },
  });
});
