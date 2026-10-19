import { Schema, model } from 'mongoose';
import { BOOKING_STATUSES } from '../config/constants';

const bookingSchema = new Schema(
  {
    reference: { type: String, required: true, unique: true },
    listingId: { type: Schema.Types.ObjectId, ref: 'Listing', required: true },
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    // startDate = first night, endDate = check-out day (not charged)
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    guests: { type: Number, required: true, min: 1 },
    status: { type: String, enum: BOOKING_STATUSES, default: 'HELD', index: true },
    price: {
      nights: Number,
      baseTotal: Number,
      weekendSurcharge: Number,
      discount: Number,
      total: Number,
      currency: String,
    },
    holdExpiresAt: { type: Date },
    paidAt: { type: Date },
    stripeSessionId: { type: String },
    cancelledAt: { type: Date },
  },
  { timestamps: true }
);

export const Booking = model('Booking', bookingSchema);
