import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny } from 'zod';

interface ValidationSchemas {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

export function validate(schemas: ValidationSchemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const validated: { body?: unknown; query?: unknown; params?: unknown } = {};

      if (schemas.params) {
        validated.params = schemas.params.parse(req.params);
      }
      if (schemas.query) {
        validated.query = schemas.query.parse(req.query);
      }
      if (schemas.body) {
        validated.body = schemas.body.parse(req.body);
      }

      req.validated = validated;
      next();
    } catch (error) {
      next(error);
    }
  };
}
