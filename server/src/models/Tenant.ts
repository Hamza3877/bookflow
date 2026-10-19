import { Schema, model } from 'mongoose';

// A tenant is one business using the platform (e.g. "Karachi Car Rentals").
const tenantSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const Tenant = model('Tenant', tenantSchema);
