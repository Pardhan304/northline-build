import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  FRONTEND_ORIGIN: z.string().url().default('http://localhost:3000'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DIRECT_URL: z.string().min(1, 'DIRECT_URL is required'),
  SESSION_SECRET: z
    .string()
    .min(32, 'SESSION_SECRET must be at least 32 characters')
    .default('dev-only-session-secret-change-me-32-chars'),
  COOKIE_NAME: z.string().min(1).default('northline_session'),
  SESSION_IDLE_TTL_HOURS: z.coerce.number().int().positive().default(24),
  SESSION_ABSOLUTE_TTL_DAYS: z.coerce.number().int().positive().default(7),
  STORAGE_PROVIDER: z.enum(['local', 's3']).default('local'),
  LOCAL_UPLOAD_DIR: z.string().min(1).default('uploads'),
  PUBLIC_ASSET_BASE_URL: z.string().url().default('http://localhost:5000/uploads'),
  REVALIDATE_URL: z.string().url().optional().or(z.literal('')),
  REVALIDATE_SECRET: z.string().min(16).optional().or(z.literal('')),
  KEEP_ALIVE_ENABLED: z.enum(['true', 'false']).optional(),
  KEEP_ALIVE_URL: z.string().url().optional().or(z.literal('')),
  KEEP_ALIVE_INTERVAL_MS: z.coerce
    .number()
    .int()
    .min(60_000)
    .default(10 * 60 * 1000),
  RENDER_EXTERNAL_URL: z.string().url().optional().or(z.literal('')),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(raw: NodeJS.ProcessEnv = process.env): Env {
  const parsed = envSchema.safeParse(raw);
  if (!parsed.success) {
    const formatted = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid environment configuration: ${formatted}`);
  }
  return parsed.data;
}

export const env: Env = parseEnv();
