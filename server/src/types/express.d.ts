import { Role } from '../config/constants';

declare global {
  namespace Express {
    interface Request {
      // Filled in by requireAuth for logged-in users.
      user?: { id: string; role: Role; tenantId?: string };
    }
  }
}

export {};
