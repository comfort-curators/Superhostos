import { BookingsRepository } from '../../bookings/repository';
import { clamp } from '../math';

const MS_PER_DAY = 86_400_000;
// Reservations in these states consume amenities / drive demand.
const ACTIVE = new Set(['confirmed', 'checked_in']);

function toDay(iso: string): number {
  return Math.floor(new Date(`${iso}T00:00:00Z`).getTime() / MS_PER_DAY);
}

/**
 * Booking Agent (patent §4.3).
 *
 * Reads forward-looking occupancy from the bookings domain and exposes it as a
 * demand signal in [0, 1] (occupied-room-nights / horizon-nights) for the
 * Inventory Agent, via the shared memory layer rather than direct coupling.
 */
export class BookingAgent {
  constructor(private readonly bookings: BookingsRepository = new BookingsRepository()) {}

  occupancyRate(propertyId: string, horizonDays: number, now: Date = new Date()): number {
    const windowStart = Math.floor(now.getTime() / MS_PER_DAY);
    const windowEnd = windowStart + horizonDays;

    const occupiedNights = this.bookings
      .list({ propertyId })
      .filter((booking) => ACTIVE.has(booking.status))
      .reduce((acc, booking) => {
        const start = Math.max(toDay(booking.checkIn), windowStart);
        const end = Math.min(toDay(booking.checkOut), windowEnd);
        return acc + Math.max(0, end - start);
      }, 0);

    return clamp(occupiedNights / horizonDays, 0, 1);
  }
}
