import { Schema, model } from 'mongoose';
import { LISTING_TYPES } from '../config/constants';

const listingSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    type: { type: String, enum: LISTING_TYPES, required: true },
    city: { type: String, required: true, trim: true },
    address: { type: String, default: '' },
    // GeoJSON point: coordinates are [longitude, latitude]
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true },
    },
    pricePerDay: { type: Number, required: true, min: 1 },
    currency: { type: String, default: 'PKR' },
    maxGuests: { type: Number, required: true, min: 1 },
    images: { type: [String], default: [] },
    amenities: { type: [String], default: [] },
    // Pricing rules the owner controls
    weekendMultiplier: { type: Number, default: 1.2, min: 1 },
    longStayDiscountPercent: { type: Number, default: 10, min: 0, max: 50 },
    isActive: { type: Boolean, default: true },
    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

listingSchema.index({ location: '2dsphere' });
listingSchema.index({ city: 1, type: 1, pricePerDay: 1 });

export const Listing = model('Listing', listingSchema);
