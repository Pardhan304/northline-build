import type { Request, Response } from 'express';
import { env } from '../../config/env.js';
import { generateOpaqueToken } from '../../lib/crypto.js';
import { sendSuccess } from '../../lib/response.js';
import { CSRF_COOKIE_NAME } from '../../middlewares/auth.js';
import type { LoginInput } from './auth.schema.js';
import { loginWithCredentials, logoutSession } from './auth.service.js';

function getSessionCookieOptions(expires?: Date) {
  const isProd = env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
    path: '/',
    expires,
  };
}

function getCsrfCookieOptions() {
  const isProd = env.NODE_ENV === 'production';
  return {
    httpOnly: false,
    secure: isProd,
    sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
    path: '/',
    maxAge: 24 * 60 * 60 * 1000,
  };
}

export function issueCsrfToken(_req: Request, res: Response): void {
  const token = generateOpaqueToken(32);
  res.cookie(CSRF_COOKIE_NAME, token, getCsrfCookieOptions());
  sendSuccess(res, {
    message: 'CSRF token issued.',
    data: { csrfToken: token },
  });
}

export async function login(req: Request, res: Response): Promise<void> {
  const body = req.validated?.body as LoginInput;
  const result = await loginWithCredentials(body, {
    ipAddress: req.ip ?? null,
    userAgent: req.get('user-agent') ?? null,
  });

  const csrfToken = generateOpaqueToken(32);
  res.cookie(env.COOKIE_NAME, result.sessionToken, getSessionCookieOptions(result.expiresAt));
  res.cookie(CSRF_COOKIE_NAME, csrfToken, getCsrfCookieOptions());

  sendSuccess(res, {
    message: 'Authenticated successfully.',
    data: {
      user: result.user,
      csrfToken,
    },
  });
}

export async function logout(req: Request, res: Response): Promise<void> {
  if (req.sessionId && req.user) {
    await logoutSession(req.sessionId, req.user.id, {
      ipAddress: req.ip ?? null,
      userAgent: req.get('user-agent') ?? null,
    });
  }

  res.clearCookie(env.COOKIE_NAME, getSessionCookieOptions());
  res.clearCookie(CSRF_COOKIE_NAME, {
    path: '/',
    secure: env.NODE_ENV === 'production',
    sameSite: (env.NODE_ENV === 'production' ? 'none' : 'lax') as 'none' | 'lax',
  });

  sendSuccess(res, {
    message: 'Logged out successfully.',
    data: null,
  });
}

export function getMe(req: Request, res: Response): void {
  sendSuccess(res, {
    message: 'Current user profile fetched.',
    data: { user: req.user ?? null },
  });
}
