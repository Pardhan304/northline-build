import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

export const DEFAULT_KEEP_ALIVE_INTERVAL_MS = 10 * 60 * 1000;

export interface KeepAliveConfigInput {
  nodeEnv: string;
  keepAliveEnabled?: 'true' | 'false';
  keepAliveUrl?: string;
  renderExternalUrl?: string;
}

export interface KeepAliveHandle {
  targetUrl: string;
  intervalMs: number;
  stop: () => void;
}

export function resolveKeepAliveTargetUrl(config: KeepAliveConfigInput): string | null {
  if (config.nodeEnv === 'test') {
    return null;
  }
  if (config.keepAliveEnabled === 'false') {
    return null;
  }

  const explicitUrl = config.keepAliveUrl?.trim();
  if (explicitUrl) {
    return explicitUrl;
  }

  const renderBase = config.renderExternalUrl?.trim();
  if (renderBase) {
    return `${renderBase.replace(/\/+$/, '')}/api/v1/health`;
  }

  return null;
}

export async function pingKeepAlive(
  targetUrl: string,
  fetchImpl: typeof fetch = fetch,
): Promise<boolean> {
  try {
    const response = await fetchImpl(targetUrl, {
      method: 'GET',
      headers: {
        'user-agent': 'northline-keep-alive/1.0',
      },
      signal: AbortSignal.timeout(8_000),
    });

    if (!response.ok) {
      logger.warn({ targetUrl, status: response.status }, 'Keep-alive ping returned non-2xx');
      return false;
    }

    logger.debug({ targetUrl, status: response.status }, 'Keep-alive ping succeeded');
    return true;
  } catch (error) {
    logger.warn(
      { targetUrl, error: error instanceof Error ? error.message : String(error) },
      'Keep-alive ping failed',
    );
    return false;
  }
}

export function startKeepAlive(options?: {
  config?: KeepAliveConfigInput;
  intervalMs?: number;
  fetchImpl?: typeof fetch;
}): KeepAliveHandle | null {
  const config: KeepAliveConfigInput = options?.config ?? {
    nodeEnv: env.NODE_ENV,
    keepAliveEnabled: env.KEEP_ALIVE_ENABLED,
    keepAliveUrl: env.KEEP_ALIVE_URL,
    renderExternalUrl: env.RENDER_EXTERNAL_URL,
  };

  const targetUrl = resolveKeepAliveTargetUrl(config);
  if (!targetUrl) {
    return null;
  }

  const intervalMs =
    options?.intervalMs ?? env.KEEP_ALIVE_INTERVAL_MS ?? DEFAULT_KEEP_ALIVE_INTERVAL_MS;
  const fetchImpl = options?.fetchImpl ?? fetch;

  const timer = setInterval(() => {
    void pingKeepAlive(targetUrl, fetchImpl);
  }, intervalMs);

  // Do not hold the Node event loop open if everything else shuts down cleanly.
  if (typeof timer.unref === 'function') {
    timer.unref();
  }

  logger.info({ targetUrl, intervalMs }, 'Render keep-alive scheduler started');

  return {
    targetUrl,
    intervalMs,
    stop: () => {
      clearInterval(timer);
      logger.info('Render keep-alive scheduler stopped');
    },
  };
}
