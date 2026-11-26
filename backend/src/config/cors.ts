import type { CorsOptions } from 'cors';
import { env } from './env.js';

const allowedOrigins = env.FRONTEND_ORIGIN.split(',')
  .map((origin) => origin.trim().replace(/\/+$/, ''))
  .filter(Boolean);

const VERCEL_ORIGIN_PATTERN = /^https:\/\/northline-build(-[a-z0-9-]+)*\.vercel\.app$/;

export function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return false;
  const normalized = origin.replace(/\/+$/, '');
  return allowedOrigins.includes(normalized) || VERCEL_ORIGIN_PATTERN.test(normalized);
}

export const corsOptions: CorsOptions = {
  origin(origin, callback) {
    // Allow non-browser requests with no Origin header (e.g. curl, health checks, SSR)
    if (!origin) {
      callback(null, true);
      return;
    }
    if (isAllowedOrigin(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error(`Origin ${origin} is not allowed by CORS`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-CSRF-Token', 'X-Request-Id'],
};
