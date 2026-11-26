import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_KEEP_ALIVE_INTERVAL_MS,
  pingKeepAlive,
  resolveKeepAliveTargetUrl,
  startKeepAlive,
} from '../../src/lib/keep-alive.js';

describe('Render keep-alive scheduler', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('resolves KEEP_ALIVE_URL first, falls back to RENDER_EXTERNAL_URL, and skips test/disabled envs', () => {
    expect(
      resolveKeepAliveTargetUrl({
        nodeEnv: 'production',
        keepAliveUrl: 'https://custom.example.com/health',
        renderExternalUrl: 'https://northline.onrender.com',
      }),
    ).toBe('https://custom.example.com/health');

    expect(
      resolveKeepAliveTargetUrl({
        nodeEnv: 'production',
        renderExternalUrl: 'https://northline.onrender.com/',
      }),
    ).toBe('https://northline.onrender.com/api/v1/health');

    expect(
      resolveKeepAliveTargetUrl({
        nodeEnv: 'production',
        keepAliveEnabled: 'false',
        renderExternalUrl: 'https://northline.onrender.com',
      }),
    ).toBeNull();

    expect(
      resolveKeepAliveTargetUrl({
        nodeEnv: 'test',
        keepAliveUrl: 'https://northline.onrender.com/api/v1/health',
      }),
    ).toBeNull();
  });

  it('pings every 10 minutes by default and stops cleanly', async () => {
    const mockFetch = vi.fn<typeof fetch>().mockResolvedValue(new Response('ok', { status: 200 }));

    const handle = startKeepAlive({
      config: {
        nodeEnv: 'production',
        renderExternalUrl: 'https://northline.onrender.com',
      },
      fetchImpl: mockFetch,
    });

    expect(handle).not.toBeNull();
    expect(handle?.intervalMs).toBe(DEFAULT_KEEP_ALIVE_INTERVAL_MS);
    expect(mockFetch).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(10 * 60 * 1000);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch.mock.calls[0]?.[0]).toBe('https://northline.onrender.com/api/v1/health');

    await vi.advanceTimersByTimeAsync(10 * 60 * 1000);
    expect(mockFetch).toHaveBeenCalledTimes(2);

    handle?.stop();
    await vi.advanceTimersByTimeAsync(10 * 60 * 1000);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('handles non-2xx and network failures without throwing', async () => {
    const failingStatusFetch = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response('unavailable', { status: 503 }));
    expect(await pingKeepAlive('https://northline.onrender.com/api/v1/health', failingStatusFetch)).toBe(
      false,
    );

    const networkErrorFetch = vi.fn<typeof fetch>().mockRejectedValue(new Error('ECONNRESET'));
    expect(await pingKeepAlive('https://northline.onrender.com/api/v1/health', networkErrorFetch)).toBe(
      false,
    );
  });
});
