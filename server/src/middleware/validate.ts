import { NextFunction, Request, Response } from 'express';
import { ZodSchema } from 'zod';

// Checks req.body against a zod schema and replaces it with the clean result.
export const validateBody = (schema: ZodSchema) => (req: Request, _res: Response, next: NextFunction) => {
  const result = schema.safeParse(req.body);
  if (!result.success) return next(result.error);
  req.body = result.data;
  next();
};
