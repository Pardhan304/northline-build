import rateLimit from 'express-rate-limit';
import type { Request, Response } from 'express';
import { env } from '../config/env.js';

function createRateLimitHandler(message: string) {
  return (_req: Request, res: Response): void => {
    res.status(429).json({
      success: false,
      message,
      error: {
        code: 'RATE_LIMITED',
        details: [],
      },
    });
  };
}

const skipInTest = (): boolean => env.NODE_ENV === 'test';

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
  handler: createRateLimitHandler('Too many login attempts. Please wait 15 minutes and try again.'),
});

export const enquiryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
  handler: createRateLimitHandler('Too many enquiries submitted. Please try again shortly.'),
});

export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
  handler: createRateLimitHandler('Too many upload requests. Please slow down and try again.'),
});

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => skipInTest() || req.path === '/health',
  handler: createRateLimitHandler('Rate limit exceeded. Please try again later.'),
});
