import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError';

export function notFound(_req: Request, _res: Response, next: NextFunction) {
  next(new AppError(404, 'Route not found'));
}

// One place that turns every kind of error into a clean JSON response.
export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.status).json({ message: err.message, code: err.code });
  }
  if (err instanceof ZodError) {
    const message = err.issues.map((i) => `${i.path.join('.') || 'value'}: ${i.message}`).join(', ');
    return res.status(400).json({ message, code: 'VALIDATION_ERROR' });
  }
  if (err?.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid id', code: 'BAD_ID' });
  }
  if (err?.code === 11000) {
    return res.status(409).json({ message: 'That value is already in use', code: 'DUPLICATE' });
  }
  console.error(err);
  res.status(500).json({ message: 'Something went wrong on our side. Please try again.' });
}
