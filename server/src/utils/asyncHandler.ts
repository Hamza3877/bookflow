import { NextFunction, Request, RequestHandler, Response } from 'express';

// Express 4 does not catch errors from async functions by itself.
// Wrapping a handler with this sends any error to our error middleware.
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };
