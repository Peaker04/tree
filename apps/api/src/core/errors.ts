import { ERROR_CODES, type ErrorCode } from '@novyx/contracts';

/**
 * Base application domain error.
 * Pure TypeScript core — zero infrastructure dependencies.
 */
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(message: string, code: ErrorCode = ERROR_CODES.INTERNAL, statusCode = 500, details?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', details?: unknown) {
    super(message, ERROR_CODES.NOT_FOUND, 404, details);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict occurred', details?: unknown) {
    super(message, ERROR_CODES.CONFLICT, 409, details);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details?: unknown) {
    super(message, ERROR_CODES.VALIDATION_FAILED, 400, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthenticated', details?: unknown) {
    super(message, ERROR_CODES.UNAUTHENTICATED, 401, details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden', details?: unknown) {
    super(message, ERROR_CODES.FORBIDDEN, 403, details);
  }
}
