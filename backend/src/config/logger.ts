import pino from 'pino';
import { pinoHttp } from 'pino-http';
import crypto from 'node:crypto';
import type { IncomingMessage } from 'node:http';
import { env } from '../config/env.js';

export const logger = pino({
  level: env.NODE_ENV === 'test' ? 'silent' : env.LOG_LEVEL,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'res.headers["set-cookie"]',
      '*.password',
      '*.passwordHash',
      '*.token',
      '*.tokenHash',
    ],
    censor: '[REDACTED]',
  },
});

export const httpLogger = pinoHttp({
  logger,
  genReqId(req: IncomingMessage) {
    const incoming = req.headers['x-request-id'];
    if (typeof incoming === 'string' && incoming.trim().length > 0 && incoming.length <= 128) {
      return incoming.trim();
    }
    return crypto.randomUUID();
  },
  customProps(req) {
    return { requestId: req.id };
  },
});
