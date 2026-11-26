import type { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import multer from 'multer';
import { ZodError } from 'zod';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { AppError, type ErrorCode, type ErrorDetail } from '../lib/errors.js';

interface ErrorEnvelope {
  success: false;
  message: string;
  error: {
    code: ErrorCode;
    details: ErrorDetail[];
  };
}

function sendError(
  res: Response,
  statusCode: number,
  code: ErrorCode,
  message: string,
  details: ErrorDetail[] = [],
): void {
  const payload: ErrorEnvelope = {
    success: false,
    message,
    error: {
      code,
      details,
    },
  };
  res.status(statusCode).json(payload);
}

export function notFoundHandler(_req: Request, res: Response): void {
  sendError(res, 404, 'NOT_FOUND', 'The requested endpoint does not exist.');
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    sendError(res, err.statusCode, err.code, err.message, err.details ?? []);
    return;
  }

  if (err instanceof ZodError) {
    const details: ErrorDetail[] = err.issues.map((issue) => ({
      field: issue.path.join('.') || undefined,
      message: issue.message,
    }));
    sendError(res, 400, 'VALIDATION_ERROR', 'The submitted data is invalid.', details);
    return;
  }

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      sendError(res, 413, 'PAYLOAD_TOO_LARGE', 'Uploaded file exceeds the maximum allowed size.');
      return;
    }
    sendError(res, 400, 'VALIDATION_ERROR', err.message);
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = Array.isArray(err.meta?.target) ? err.meta.target.join(', ') : 'unique field';
      sendError(res, 409, 'CONFLICT', `A record with this ${target} already exists.`);
      return;
    }
    if (err.code === 'P2025') {
      sendError(res, 404, 'NOT_FOUND', 'The requested record could not be found.');
      return;
    }
    if (err.code === 'P2003') {
      sendError(
        res,
        409,
        'CONFLICT',
        'This record cannot be modified or deleted because it is referenced by another resource.',
      );
      return;
    }
  }

  if (err instanceof SyntaxError && 'body' in err) {
    sendError(res, 400, 'VALIDATION_ERROR', 'Malformed JSON request body.');
    return;
  }

  if (err instanceof Error && err.message.includes('not allowed by CORS')) {
    sendError(res, 403, 'FORBIDDEN', 'Origin is not permitted.');
    return;
  }

  logger.error({ err, requestId: req.id, path: req.path }, 'Unhandled application error');

  const message =
    env.NODE_ENV === 'production'
      ? 'An unexpected server error occurred.'
      : err instanceof Error
        ? err.message
        : 'An unexpected server error occurred.';

  sendError(res, 500, 'INTERNAL_ERROR', message);
}
