import type { NextFunction, Request, Response } from 'express';
import type { Role } from '@prisma/client';
import { prisma } from '../config/database.js';
import { env } from '../config/env.js';
import { isAllowedOrigin } from '../config/cors.js';
import { hashToken, timingSafeEqualStrings } from '../lib/crypto.js';
import { forbidden, unauthorized } from '../lib/errors.js';

export const CSRF_COOKIE_NAME = 'northline_csrf';
export const CSRF_HEADER_NAME = 'x-csrf-token';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const rawToken = req.cookies?.[env.COOKIE_NAME];
    if (typeof rawToken !== 'string' || rawToken.length < 32) {
      next(unauthorized('Authentication is required.'));
      return;
    }

    const tokenHash = hashToken(rawToken);
    const session = await prisma.session.findUnique({
      where: { tokenHash },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
          },
        },
      },
    });

    if (!session || session.revokedAt !== null || session.expiresAt <= new Date()) {
      next(unauthorized('Session has expired or is invalid.'));
      return;
    }

    if (!session.user.isActive) {
      next(unauthorized('Account is disabled.'));
      return;
    }

    req.user = session.user;
    req.sessionId = session.id;
    next();
  } catch (error) {
    next(error);
  }
}

export function requireRole(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(unauthorized('Authentication is required.'));
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      next(forbidden('You do not have permission to perform this action.'));
      return;
    }
    next();
  };
}

/**
 * Protects cookie-authenticated state-changing requests via double-submit CSRF token
 * and Origin/Referer validation when present.
 */
export function requireCsrf(req: Request, _res: Response, next: NextFunction): void {
  if (SAFE_METHODS.has(req.method.toUpperCase())) {
    next();
    return;
  }

  const origin = req.headers.origin;
  if (origin !== undefined && !isAllowedOrigin(origin)) {
    next(forbidden('Invalid request origin.'));
    return;
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
  const headerToken = req.headers[CSRF_HEADER_NAME];

  if (
    typeof cookieToken !== 'string' ||
    typeof headerToken !== 'string' ||
    cookieToken.length < 32 ||
    !timingSafeEqualStrings(cookieToken, headerToken)
  ) {
    next(forbidden('Invalid or missing CSRF token.'));
    return;
  }

  next();
}
