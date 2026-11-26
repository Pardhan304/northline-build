export interface ErrorDetail {
  field?: string;
  message: string;
}

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'PAYLOAD_TOO_LARGE'
  | 'UNSUPPORTED_MEDIA_TYPE'
  | 'RATE_LIMITED'
  | 'DATABASE_UNAVAILABLE'
  | 'INTERNAL_ERROR';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly details?: ErrorDetail[];

  constructor(statusCode: number, code: ErrorCode, message: string, details?: ErrorDetail[]) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const badRequest = (message: string, details?: ErrorDetail[]): AppError =>
  new AppError(400, 'VALIDATION_ERROR', message, details);

export const unauthorized = (message = 'Authentication is required.'): AppError =>
  new AppError(401, 'UNAUTHORIZED', message);

export const forbidden = (
  message = 'You do not have permission to perform this action.',
): AppError => new AppError(403, 'FORBIDDEN', message);

export const notFound = (message = 'Resource not found.'): AppError =>
  new AppError(404, 'NOT_FOUND', message);

export const conflict = (message: string, details?: ErrorDetail[]): AppError =>
  new AppError(409, 'CONFLICT', message, details);

export const payloadTooLarge = (
  message = 'Uploaded file exceeds maximum allowed size.',
): AppError => new AppError(413, 'PAYLOAD_TOO_LARGE', message);

export const unsupportedMediaType = (message = 'Unsupported file or media type.'): AppError =>
  new AppError(415, 'UNSUPPORTED_MEDIA_TYPE', message);
