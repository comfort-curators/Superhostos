import { clamp } from '../math';
import { defaultOccupancySource, type OccupancySource } from '../occupancy';

const MS_PER_DAY = 86_400_000;
// Reservations in these states consume amenities / drive demand.
const ACTIVE = new Set(['confirmed', 'checked_in']);

function toDay(iso: string): number {
  return Math.floor(new Date(`${iso}T00:00:00Z`).getTime() / MS_PER_DAY);
}

/**
 * Booking Agent (patent §4.3).
 *
 * Exposes forward-looking occupancy as a demand signal in [0, 1]
 * (occupied-room-nights / horizon-nights) for the Inventory Agent. It reads from
 * a synchronous occupancy snapshot, decoupled from the async bookings store.
 */
export class BookingAgent {
  constructor(private readonly source: OccupancySource = defaultOccupancySource) {}

  occupancyRate(propertyId: string, horizonDays: number, now: Date = new Date()): number {
    const windowStart = Math.floor(now.getTime() / MS_PER_DAY);
    const windowEnd = windowStart + horizonDays;

    const occupiedNights = this.source
      .staysFor(propertyId)
      .filter((stay) => ACTIVE.has(stay.status))
      .reduce((acc, stay) => {
        const start = Math.max(toDay(stay.checkIn), windowStart);
        const end = Math.min(toDay(stay.checkOut), windowEnd);
        return acc + Math.max(0, end - start);
      }, 0);

    return clamp(occupiedNights / horizonDays, 0, 1);
  }
}
