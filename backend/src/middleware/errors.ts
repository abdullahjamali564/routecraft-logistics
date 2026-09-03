import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import mongoose from 'mongoose';

export class AppError extends Error {
  constructor(public readonly statusCode: number, message: string, public readonly code = 'APP_ERROR', public readonly details?: unknown) {
    super(message);
    this.name = 'AppError';
  }
}

export const asyncHandler = (handler: (req: Parameters<RequestHandler>[0], res: Parameters<RequestHandler>[1], next: Parameters<RequestHandler>[2]) => Promise<unknown>): RequestHandler =>
  (req, res, next) => { void handler(req, res, next).catch(next); };

export const notFoundHandler: RequestHandler = (req, _res, next) => next(new AppError(404, `Route not found: ${req.method} ${req.path}`, 'NOT_FOUND'));

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  let statusCode = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'An unexpected error occurred';
  let details: unknown;

  if (error instanceof AppError) ({ statusCode, code, message, details } = error);
  else if (error instanceof ZodError) {
    statusCode = 400; code = 'VALIDATION_ERROR'; message = 'Request validation failed'; details = error.flatten();
  } else if (error instanceof mongoose.Error.ValidationError) {
    statusCode = 400; code = 'VALIDATION_ERROR'; message = 'Database validation failed'; details = Object.values(error.errors).map(({ path, message: issue }) => ({ path, message: issue }));
  } else if (error?.code === 11000) {
    statusCode = 409; code = 'DUPLICATE_RESOURCE'; message = 'A resource with that unique value already exists';
  }

  req.log?.error({ err: error, statusCode }, 'request failed');
  res.status(statusCode).json({ success: false, error: { code, message, ...(details === undefined ? {} : { details }), ...(process.env.NODE_ENV === 'development' ? { stack: error instanceof Error ? error.stack : undefined } : {}) } });
};
