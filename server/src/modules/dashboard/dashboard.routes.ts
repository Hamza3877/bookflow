import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth';
import { ownerDashboard } from './dashboard.controller';

export const dashboardRouter = Router();

dashboardRouter.get('/owner', requireAuth, requireRole('owner'), ownerDashboard);
