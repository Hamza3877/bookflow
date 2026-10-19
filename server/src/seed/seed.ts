import bcrypt from 'bcryptjs';
import mongoose, { Types } from 'mongoose';
import { connectDb } from '../config/db';
import { isProd } from '../config/env';
import { AuditLog } from '../models/AuditLog';
import { BookedDay } from '../models/BookedDay';
import { Booking } from '../models/Booking';
import { Listing } from '../models/Listing';
import { Review } from '../models/Review';
import { Tenant } from '../models/Tenant';
import { User } from '../models/User';
import { quoteFor } from '../services/booking.service';
import { eachNight, todayUtc } from '../utils/dates';

// Demo logins (printed at the end):
//   admin@bookflow.dev  / Admin@123
//   owner@bookflow.dev  / Owner@123   (Karachi Car Rentals)
//   hunza@bookflow.dev  / Owner@123   (Northern Escapes)
//   demo@bookflow.dev   / Demo@123    (customer)

const photo = (seed: string) => `https://picsum.photos/seed/${seed}/900/600`;
const DAY = 86400000;

// A tiny seeded random generator so every seed run creates the same data.
let state = 42;
const random = () => {
  state = (state * 1664525 + 1013904223) % 4294967296;
  return state / 4294967296;
};
const pick = <T,>(list: T[]) => list[Math.floor(random() * list.length)];

async function main() {
  if (isProd && !process.argv.includes('--force')) {
    console.error('Refusing to wipe a production database. Add --force if you really mean it.');
    process.exit(1);
  }
  await connectDb();
  await Promise.all([User, Tenant, Listing, Booking, BookedDay, Review, AuditLog].map((m) => m.deleteMany({})));
  await mongoose.syncIndexes();

  const hash = (password: string) => bcrypt.hash(password, 10);

  // ---- users and businesses ----
  const adminPassword = await hash('Admin@123');
  const ownerPassword = await hash('Owner@123');
  const demoPassword = await hash('Demo@123');

  await User.create({ name: 'Platform Admin', email: 'admin@bookflow.dev', role: 'admin', passwordHash: adminPassword });

  const ownerId1 = new Types.ObjectId();
  const tenant1 = await Tenant.create({ name: 'Karachi Car Rentals', city: 'Karachi', ownerId: ownerId1 });
  await User.create({ _id: ownerId1, name: 'Bilal Ahmed', email: 'owner@bookflow.dev', role: 'owner', tenantId: tenant1._id, passwordHash: ownerPassword });

  const ownerId2 = new Types.ObjectId();
  const tenant2 = await Tenant.create({ name: 'Northern Escapes', city: 'Hunza', ownerId: ownerId2 });
  await User.create({ _id: ownerId2, name: 'Sana Karim', email: 'hunza@bookflow.dev', role: 'owner', tenantId: tenant2._id, passwordHash: ownerPassword });

  const customers = await User.create([
    { name: 'Ayesha Khan', email: 'demo@bookflow.dev', role: 'customer', passwordHash: demoPassword },
    { name: 'Hamza Raza', email: 'hamza@bookflow.dev', role: 'customer', passwordHash: demoPassword },
    { name: 'Maryam Tariq', email: 'maryam@bookflow.dev', role: 'customer', passwordHash: demoPassword },
    { name: 'Usman Ali', email: 'usman@bookflow.dev', role: 'customer', passwordHash: demoPassword },
  ]);

  // ---- listings ----
  const base = { currency: 'PKR', isActive: true };
  const listings = await Listing.create([
    { ...base, tenantId: tenant1._id, title: 'Toyota Corolla Altis 2023', type: 'car', city: 'Karachi', address: 'Clifton Block 5',
      description: 'Clean and comfortable sedan with automatic transmission. Fuel-efficient and perfect for city trips, airport pickups and business meetings. Fully insured with 24/7 roadside support.',
      location: { type: 'Point', coordinates: [67.03, 24.8138] }, pricePerDay: 12000, maxGuests: 4, weekendMultiplier: 1.15, longStayDiscountPercent: 10,
      amenities: ['Automatic', 'Air conditioning', 'Bluetooth', 'Insured'], images: [photo('corolla1'), photo('corolla2'), photo('corolla3')] },
    { ...base, tenantId: tenant1._id, title: 'Toyota Fortuner 7-Seater', type: 'car', city: 'Karachi', address: 'DHA Phase 6',
      description: 'Spacious 7-seater SUV for family trips and long drives. Powerful diesel engine, plenty of luggage space and a smooth ride on highways. Driver available on request.',
      location: { type: 'Point', coordinates: [67.0617, 24.7926] }, pricePerDay: 28000, maxGuests: 7, weekendMultiplier: 1.2, longStayDiscountPercent: 12,
      amenities: ['7 seats', 'Automatic', '4x4', 'Driver available', 'Insured'], images: [photo('fortuner1'), photo('fortuner2'), photo('fortuner3')] },
    { ...base, tenantId: tenant1._id, title: 'Honda City Aspire', type: 'car', city: 'Lahore', address: 'Gulberg III',
      description: 'Smart and reliable sedan, great for getting around Lahore. Low fuel consumption, spotless interior and quick pickup from Gulberg or the airport.',
      location: { type: 'Point', coordinates: [74.3436, 31.5204] }, pricePerDay: 10500, maxGuests: 4, weekendMultiplier: 1.1, longStayDiscountPercent: 8,
      amenities: ['Automatic', 'Air conditioning', 'USB charging'], images: [photo('city1'), photo('city2'), photo('city3')] },
    { ...base, tenantId: tenant1._id, title: 'Toyota Hiace Grand Cabin 12-Seater', type: 'car', city: 'Islamabad', address: 'F-10 Markaz',
      description: 'Roomy 12-seater van for group tours, wedding events and corporate travel. Experienced driver included, ideal for trips to Murree and the northern areas.',
      location: { type: 'Point', coordinates: [73.0169, 33.6938] }, pricePerDay: 22000, maxGuests: 12, weekendMultiplier: 1.25, longStayDiscountPercent: 10,
      amenities: ['12 seats', 'Driver included', 'Air conditioning', 'Roof carrier'], images: [photo('hiace1'), photo('hiace2'), photo('hiace3')] },
    { ...base, tenantId: tenant1._id, title: 'Sea-View Apartment, Clifton', type: 'apartment', city: 'Karachi', address: 'Clifton Block 2',
      description: 'Bright two-bedroom apartment a short walk from the beach. Fully furnished kitchen, fast WiFi and a balcony with sea views. Secure building with parking and a backup generator.',
      location: { type: 'Point', coordinates: [67.0234, 24.8162] }, pricePerDay: 16000, maxGuests: 5, weekendMultiplier: 1.3, longStayDiscountPercent: 15,
      amenities: ['WiFi', 'Kitchen', 'Parking', 'Generator', 'Sea view'], images: [photo('clifton1'), photo('clifton2'), photo('clifton3')] },
    { ...base, tenantId: tenant1._id, title: 'Modern Studio in Gulberg', type: 'studio', city: 'Lahore', address: 'Gulberg Main Boulevard',
      description: 'Compact, stylish studio close to cafes and shopping. Great for solo travellers and business stays with a work desk, fast WiFi and self check-in.',
      location: { type: 'Point', coordinates: [74.3587, 31.5497] }, pricePerDay: 9000, maxGuests: 2, weekendMultiplier: 1.2, longStayDiscountPercent: 10,
      amenities: ['WiFi', 'Work desk', 'Self check-in', 'Air conditioning'], images: [photo('studio1'), photo('studio2'), photo('studio3')] },
    { ...base, tenantId: tenant2._id, title: 'Mountain View Villa, Karimabad', type: 'villa', city: 'Hunza', address: 'Karimabad, Hunza Valley',
      description: 'A peaceful villa with open views of Rakaposhi and the Hunza valley. Four bedrooms, a wood-fired heater, a large garden and local breakfast included. Perfect for families and friends.',
      location: { type: 'Point', coordinates: [74.6573, 36.3167] }, pricePerDay: 38000, maxGuests: 8, weekendMultiplier: 1.2, longStayDiscountPercent: 15,
      amenities: ['Mountain view', 'Breakfast included', 'Garden', 'Heater', 'Parking'], images: [photo('hunza1'), photo('hunza2'), photo('hunza3')] },
    { ...base, tenantId: tenant2._id, title: 'Riverside Cottage, Gulmit', type: 'villa', city: 'Hunza', address: 'Gulmit, Upper Hunza',
      description: 'Cosy stone cottage next to the river with a fireplace and a private terrace. Quiet, scenic and a short drive from Passu Cones and Attabad Lake.',
      location: { type: 'Point', coordinates: [74.8167, 36.4] }, pricePerDay: 24000, maxGuests: 4, weekendMultiplier: 1.15, longStayDiscountPercent: 10,
      amenities: ['River view', 'Fireplace', 'Terrace', 'Breakfast included'], images: [photo('gulmit1'), photo('gulmit2'), photo('gulmit3')] },
    { ...base, tenantId: tenant2._id, title: 'Pine Hill Villa, Murree', type: 'villa', city: 'Murree', address: 'Upper Mall Road',
      description: 'Warm family villa surrounded by pine trees, 10 minutes from Mall Road. Three bedrooms, a living room with a fireplace and a lawn for evening tea.',
      location: { type: 'Point', coordinates: [73.3943, 33.907] }, pricePerDay: 30000, maxGuests: 8, weekendMultiplier: 1.35, longStayDiscountPercent: 10,
      amenities: ['Fireplace', 'Lawn', 'Parking', 'Kitchen', 'WiFi'], images: [photo('murree1'), photo('murree2'), photo('murree3')] },
    { ...base, tenantId: tenant2._id, title: 'Lakeside Studio, Skardu', type: 'studio', city: 'Skardu', address: 'Near Upper Kachura Lake',
      description: 'Simple, tidy studio a few steps from the lake with mountain views from the window. Includes a heater, hot water and a breakfast basket on arrival.',
      location: { type: 'Point', coordinates: [75.4, 35.3] }, pricePerDay: 14000, maxGuests: 3, weekendMultiplier: 1.1, longStayDiscountPercent: 10,
      amenities: ['Lake view', 'Heater', 'Hot water', 'Breakfast basket'], images: [photo('skardu1'), photo('skardu2'), photo('skardu3')] },
    { ...base, tenantId: tenant2._id, title: 'Executive Apartment, F-7 Islamabad', type: 'apartment', city: 'Islamabad', address: 'F-7 Markaz',
      description: 'Modern one-bedroom apartment in the heart of F-7 with a gym and 24/7 security. Walking distance to restaurants, shops and cafes. Ideal for business travellers.',
      location: { type: 'Point', coordinates: [73.0551, 33.7215] }, pricePerDay: 15000, maxGuests: 3, weekendMultiplier: 1.2, longStayDiscountPercent: 12,
      amenities: ['WiFi', 'Gym', 'Security', 'Kitchen', 'Parking'], images: [photo('f7a'), photo('f7b'), photo('f7c')] },
    { ...base, tenantId: tenant2._id, title: 'Garden Villa, DHA Lahore', type: 'villa', city: 'Lahore', address: 'DHA Phase 5',
      description: 'Elegant villa with a private garden and a small pool, perfect for family gatherings and events. Four bedrooms, a large lounge, and a fully equipped kitchen.',
      location: { type: 'Point', coordinates: [74.4086, 31.4697] }, pricePerDay: 45000, maxGuests: 10, weekendMultiplier: 1.3, longStayDiscountPercent: 12,
      amenities: ['Pool', 'Garden', 'Kitchen', 'WiFi', 'Parking', 'Generator'], images: [photo('dha1'), photo('dha2'), photo('dha3')] },
  ]);

  // ---- bookings (past, current and future) ----
  const today = todayUtc();
  const reviewComments = [
    'Everything was exactly as described. Smooth check-in and very clean.',
    'Great value and a friendly host. We would book again.',
    'Lovely place. The location was perfect for our plans.',
    'Good experience overall. Communication was quick and clear.',
  ];
  let created = 0;

  for (let i = 0; i < 70; i++) {
    const listing = pick(listings);
    const nights = 1 + Math.floor(random() * 5);
    // from 150 days ago to 25 days ahead
    const startOffset = Math.floor(random() * 175) - 150;
    const start = new Date(today.getTime() + startOffset * DAY);
    const end = new Date(start.getTime() + nights * DAY);
    const customer = pick(customers);

    const bookingId = new Types.ObjectId();
    try {
      await BookedDay.insertMany(
        eachNight(start, end).map((date) => ({ listingId: listing._id, bookingId, date })),
        { ordered: true }
      );
    } catch {
      await BookedDay.deleteMany({ bookingId });
      continue; // those nights were taken already, skip this one
    }

    const finished = end <= today;
    const paidAt = new Date(start.getTime() - (2 + Math.floor(random() * 20)) * DAY);
    const booking = await Booking.create({
      _id: bookingId,
      reference: 'BF-' + (100000 + i * 37).toString(36).toUpperCase(),
      listingId: listing._id,
      tenantId: listing.tenantId,
      customerId: customer._id,
      startDate: start,
      endDate: end,
      guests: Math.min(listing.maxGuests, 1 + Math.floor(random() * 4)),
      status: finished ? 'COMPLETED' : 'CONFIRMED',
      price: quoteFor(listing, start, end),
      paidAt: paidAt > new Date() ? new Date() : paidAt,
    });
    created++;

    if (finished && random() > 0.35) {
      await Review.create({
        listingId: listing._id,
        bookingId: booking._id,
        customerId: customer._id,
        rating: random() > 0.25 ? 5 : 4,
        comment: pick(reviewComments),
      });
    }
  }

  // Refresh each listing's average rating from the reviews we just made.
  for (const listing of listings) {
    const stats = await Review.aggregate([
      { $match: { listingId: listing._id } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    if (stats[0]) {
      await Listing.updateOne({ _id: listing._id }, { ratingAvg: Math.round(stats[0].avg * 10) / 10, ratingCount: stats[0].count });
    }
  }

  console.log(`\nSeeded ${listings.length} listings and ${created} bookings.\n`);
  console.log('Demo logins:');
  console.log('  Customer : demo@bookflow.dev  / Demo@123');
  console.log('  Owner    : owner@bookflow.dev / Owner@123');
  console.log('  Owner 2  : hunza@bookflow.dev / Owner@123');
  console.log('  Admin    : admin@bookflow.dev / Admin@123\n');
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
