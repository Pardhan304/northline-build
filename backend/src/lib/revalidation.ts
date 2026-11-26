import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

export function signRevalidationPayload(
  bodyJson: string,
  timestamp: string,
  secret: string,
): string {
  return crypto.createHmac('sha256', secret).update(`${timestamp}.${bodyJson}`).digest('hex');
}

export async function triggerFrontendRevalidation(tags: string[]): Promise<void> {
  if (env.NODE_ENV === 'test' || !env.REVALIDATE_URL || !env.REVALIDATE_SECRET) {
    return;
  }

  const uniqueTags = [...new Set(tags)].filter(Boolean);
  if (uniqueTags.length === 0) return;

  const timestamp = String(Date.now());
  const bodyJson = JSON.stringify({ tags: uniqueTags });
  const signature = signRevalidationPayload(bodyJson, timestamp, env.REVALIDATE_SECRET);

  try {
    const response = await fetch(env.REVALIDATE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Revalidate-Timestamp': timestamp,
        'X-Revalidate-Signature': signature,
      },
      body: bodyJson,
      signal: AbortSignal.timeout(3000),
    });

    if (!response.ok) {
      logger.warn(
        { status: response.status, tags: uniqueTags },
        'Frontend cache revalidation webhook returned non-2xx status',
      );
    }
  } catch (err) {
    logger.warn({ err, tags: uniqueTags }, 'Failed to notify frontend cache revalidation');
  }
}
