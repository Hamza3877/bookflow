import { BookingStatus } from '../config/constants';
import { AppError } from '../utils/AppError';

// The life of a booking. A booking can only move along these arrows:
//
//   HELD ──pay──▶ CONFIRMED ──stay ends──▶ COMPLETED
//     │               │
//     ├─timeout─▶ EXPIRED
//     └─cancel──▶ CANCELLED ◀─cancel─┘
const allowed: Record<BookingStatus, BookingStatus[]> = {
  HELD: ['CONFIRMED', 'CANCELLED', 'EXPIRED'],
  CONFIRMED: ['CANCELLED', 'COMPLETED'],
  CANCELLED: [],
  EXPIRED: [],
  COMPLETED: [],
};

export function canTransition(from: BookingStatus, to: BookingStatus) {
  return allowed[from].includes(to);
}

export function assertTransition(from: BookingStatus, to: BookingStatus) {
  if (!canTransition(from, to)) {
    throw new AppError(409, `A ${from.toLowerCase()} booking cannot become ${to.toLowerCase()}`);
  }
}
