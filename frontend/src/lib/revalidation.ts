import crypto from 'node:crypto';

const REPLAY_WINDOW_MS = 5 * 60 * 1000;
const ALLOWED_EXACT_TAGS = new Set(['projects', 'pages', 'services', 'settings']);
const ALLOWED_PREFIXES = ['project:', 'page:'] as const;

export function isAllowedCacheTag(tag: string): boolean {
  if (ALLOWED_EXACT_TAGS.has(tag)) return true;
  return ALLOWED_PREFIXES.some(
    (prefix) => tag.startsWith(prefix) && tag.length > prefix.length && tag.length <= 180,
  );
}

export function verifyRevalidationSignature(params: {
  rawBody: string;
  timestamp: string | null;
  signature: string | null;
  secret: string;
  nowMs?: number;
}): { ok: true } | { ok: false; reason: string } {
  const { rawBody, timestamp, signature, secret, nowMs = Date.now() } = params;

  if (!secret || secret.length < 16) {
    return { ok: false, reason: 'Revalidation secret is not configured.' };
  }

  if (!timestamp || !signature) {
    return { ok: false, reason: 'Missing signature headers.' };
  }

  const parsedTs = Number(timestamp);
  if (!Number.isFinite(parsedTs) || Math.abs(nowMs - parsedTs) > REPLAY_WINDOW_MS) {
    return { ok: false, reason: 'Revalidation timestamp is outside the allowed replay window.' };
  }

  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${rawBody}`)
    .digest('hex');

  const bufActual = Buffer.from(signature);
  const bufExpected = Buffer.from(expected);
  if (bufActual.length !== bufExpected.length || !crypto.timingSafeEqual(bufActual, bufExpected)) {
    return { ok: false, reason: 'Invalid revalidation signature.' };
  }

  return { ok: true };
}
