import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth';
import { listAuditLogs, listTenants, listUsers, overview } from './admin.controller';

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole('admin'));
adminRouter.get('/overview', overview);
adminRouter.get('/users', listUsers);
adminRouter.get('/tenants', listTenants);
adminRouter.get('/audit', listAuditLogs);
