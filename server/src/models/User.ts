import { Schema, model } from 'mongoose';
import { ROLES } from '../config/constants';

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, default: 'customer' },
    // Only owners have a tenant (their business).
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant' },
    // Bumping this number logs the user out everywhere (invalidates refresh tokens).
    tokenVersion: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const User = model('User', userSchema);
