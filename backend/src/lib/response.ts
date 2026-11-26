import type { Response } from 'express';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function buildPaginationMeta(page: number, limit: number, total: number): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: total === 0 ? 0 : Math.ceil(total / limit),
  };
}

export function sendSuccess<T>(
  res: Response,
  options: {
    statusCode?: number;
    message: string;
    data: T;
    meta?: PaginationMeta;
  },
): void {
  const { statusCode = 200, message, data, meta } = options;
  const payload: {
    success: true;
    message: string;
    data: T;
    meta?: PaginationMeta;
  } = {
    success: true,
    message,
    data,
  };

  if (meta !== undefined) {
    payload.meta = meta;
  }

  res.status(statusCode).json(payload);
}
