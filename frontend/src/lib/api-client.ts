import { ApiError } from '@/lib/api-error';
import { publicEnv } from '@/lib/env';
import type { ApiErrorEnvelope, ApiSuccessEnvelope } from '@/types/api';

const CSRF_COOKIE_NAME = 'northline_csrf';
const MUTATING_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${escaped}=([^;]*)`));
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

async function ensureCsrfToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  const existing = readCookie(CSRF_COOKIE_NAME);
  if (existing) return existing;

  const response = await fetch(`${publicEnv.NEXT_PUBLIC_API_BASE_URL}/auth/csrf`, {
    method: 'GET',
    credentials: 'include',
  });
  if (!response.ok) return null;

  const payload = (await response.json()) as ApiSuccessEnvelope<{ csrfToken: string }>;
  return payload.data?.csrfToken ?? readCookie(CSRF_COOKIE_NAME);
}

export interface ApiFetchOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  requireCsrf?: boolean;
  next?: { revalidate?: number | false; tags?: string[] };
}

export async function apiRequest<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<ApiSuccessEnvelope<T>> {
  const { body, headers: customHeaders, requireCsrf = false, method = 'GET', ...rest } = options;
  const upperMethod = method.toUpperCase();
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  const headers = new Headers(customHeaders);
  if (!isFormData && body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (requireCsrf && MUTATING_METHODS.has(upperMethod)) {
    const token = await ensureCsrfToken();
    if (token) {
      headers.set('X-CSRF-Token', token);
    }
  }

  let response: Response;
  try {
    response = await fetch(`${publicEnv.NEXT_PUBLIC_API_BASE_URL}${path}`, {
      method: upperMethod,
      headers,
      credentials: 'include',
      body: isFormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
      ...rest,
    });
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', 'Unable to reach the server. Please try again.');
  }

  let parsed: ApiSuccessEnvelope<T> | ApiErrorEnvelope | null = null;
  try {
    parsed = (await response.json()) as ApiSuccessEnvelope<T> | ApiErrorEnvelope;
  } catch {
    parsed = null;
  }

  if (!response.ok || !parsed || !parsed.success) {
    const errPayload = parsed && !parsed.success ? parsed : null;
    throw new ApiError(
      response.status,
      errPayload?.error?.code ?? 'INTERNAL_ERROR',
      errPayload?.message ?? `Request failed with status ${response.status}.`,
      errPayload?.error?.details ?? [],
    );
  }

  return parsed;
}

export function buildQueryString(params: Record<string, unknown>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value));
    }
  }
  const str = search.toString();
  return str ? `?${str}` : '';
}
