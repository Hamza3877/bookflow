import { NextFunction, Request, Response } from 'express';
import { Role } from '../config/constants';
import { AppError } from '../utils/AppError';
import { verifyAccessToken } from '../utils/tokens';

// Blocks the request unless a valid access token is sent.
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(new AppError(401, 'Please log in to continue', 'NO_TOKEN'));
  }
  try {
    const payload = verifyAccessToken(header.slice(7));
    req.user = { id: payload.sub, role: payload.role, tenantId: payload.tenantId };
    next();
  } catch {
    next(new AppError(401, 'Your session has expired', 'TOKEN_EXPIRED'));
  }
}

// Allows only the listed roles. Always use after requireAuth.
export const requireRole =
  (...roles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError(403, 'You do not have permission to do this'));
    }
    next();
  };
