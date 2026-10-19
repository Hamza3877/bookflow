import { Request, Response } from 'express';
import { AuditLog } from '../../models/AuditLog';
import { Booking } from '../../models/Booking';
import { Listing } from '../../models/Listing';
import { Tenant } from '../../models/Tenant';
import { User } from '../../models/User';
import { asyncHandler } from '../../utils/asyncHandler';

export const overview = asyncHandler(async (_req: Request, res: Response) => {
  const [users, tenants, listings, bookings, revenue] = await Promise.all([
    User.countDocuments(),
    Tenant.countDocuments(),
    Listing.countDocuments(),
    Booking.countDocuments(),
    Booking.aggregate([
      { $match: { status: { $in: ['CONFIRMED', 'COMPLETED'] } } },
      { $group: { _id: null, total: { $sum: '$price.total' } } },
    ]),
  ]);
  res.json({ users, tenants, listings, bookings, revenue: revenue[0]?.total ?? 0 });
});

export const listUsers = asyncHandler(async (_req: Request, res: Response) => {
  const users = await User.find().sort({ createdAt: -1 }).limit(200);
  res.json({
    items: users.map((u) => ({
      id: u._id.toString(),
      name: u.name,
      email: u.email,
      role: u.role,
      createdAt: (u as any).createdAt,
    })),
  });
});

export const listTenants = asyncHandler(async (_req: Request, res: Response) => {
  const tenants = await Tenant.find().sort({ createdAt: -1 }).limit(200);
  const counts = await Listing.aggregate([{ $group: { _id: '$tenantId', count: { $sum: 1 } } }]);
  const countMap = new Map(counts.map((c) => [c._id.toString(), c.count as number]));
  const owners = await User.find({ _id: { $in: tenants.map((t) => t.ownerId) } });
  const ownerMap = new Map(owners.map((o) => [o._id.toString(), o.name]));

  res.json({
    items: tenants.map((t) => ({
      id: t._id.toString(),
      name: t.name,
      city: t.city,
      owner: ownerMap.get(t.ownerId.toString()) ?? '-',
      listings: countMap.get(t._id.toString()) ?? 0,
      createdAt: (t as any).createdAt,
    })),
  });
});

export const listAuditLogs = asyncHandler(async (_req: Request, res: Response) => {
  const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(100);
  const actors = await User.find({ _id: { $in: logs.map((l) => l.actorId).filter(Boolean) } });
  const actorMap = new Map(actors.map((a) => [a._id.toString(), a.name]));

  res.json({
    items: logs.map((l) => ({
      id: l._id.toString(),
      actor: l.actorId ? actorMap.get(l.actorId.toString()) ?? 'Unknown' : 'System',
      action: l.action,
      entity: l.entity,
      entityId: l.entityId,
      createdAt: (l as any).createdAt,
    })),
  });
});
