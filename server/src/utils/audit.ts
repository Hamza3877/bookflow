import { AuditLog } from '../models/AuditLog';

// Fire-and-forget: a failed log must never break the real request.
export function audit(actorId: string | undefined, action: string, entity: string, entityId?: string, meta?: object) {
  AuditLog.create({ actorId, action, entity, entityId, meta }).catch((err) =>
    console.error('Audit log failed:', err.message)
  );
}
