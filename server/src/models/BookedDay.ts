import { Schema, model } from 'mongoose';

// One document per booked night. The UNIQUE index below is what makes
// double-booking impossible: the database itself rejects a second booking
// for the same listing and night, even if two people click at the same time.
const bookedDaySchema = new Schema({
  listingId: { type: Schema.Types.ObjectId, ref: 'Listing', required: true },
  date: { type: Date, required: true },
  bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
});

bookedDaySchema.index({ listingId: 1, date: 1 }, { unique: true });

export const BookedDay = model('BookedDay', bookedDaySchema);
