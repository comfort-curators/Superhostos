import { randomUUID } from 'node:crypto';
import { bookingDatesOverlap, type BookingSource, type BookingStatus } from './contracts';

export interface BookingRecord {
  id: string;
  propertyId: string;
  source: BookingSource;
  externalReservationId: string;
  guestName: string;
  guestCount: number;
  checkIn: string;
  checkOut: string;
  status: BookingStatus;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface BookingFilter {
  propertyId?: string | undefined;
  status?: BookingStatus | undefined;
}

const STATUSES_THAT_BLOCK_DATES: ReadonlySet<BookingStatus> = new Set<BookingStatus>([
  'confirmed',
  'checked_in'
]);

function seed(): BookingRecord[] {
  const now = new Date().toISOString();
  const make = (record: Omit<BookingRecord, 'id' | 'createdAt' | 'updatedAt'>): BookingRecord => ({
    id: randomUUID(),
    createdAt: now,
    updatedAt: now,
    ...record
  });

  return [
    make({
      propertyId: '00000000-0000-0000-0000-000000000001',
      source: 'airbnb',
      externalReservationId: 'AIRBNB-1023',
      guestName: 'Dana Whitfield',
      guestCount: 2,
      checkIn: '2026-06-02',
      checkOut: '2026-06-06',
      status: 'confirmed',
      totalAmount: 1840
    }),
    make({
      propertyId: '00000000-0000-0000-0000-000000000002',
      source: 'booking_com',
      externalReservationId: 'BKG-55120',
      guestName: 'Marcus Lee',
      guestCount: 4,
      checkIn: '2026-05-28',
      checkOut: '2026-05-31',
      status: 'checked_in',
      totalAmount: 1290
    }),
    make({
      propertyId: '00000000-0000-0000-0000-000000000003',
      source: 'direct',
      externalReservationId: 'DIR-0007',
      guestName: 'Priya Nair',
      guestCount: 3,
      checkIn: '2026-06-10',
      checkOut: '2026-06-14',
      status: 'confirmed',
      totalAmount: 2120
    })
  ];
}

export class BookingsRepository {
  private readonly memory: BookingRecord[] = seed();

  list(filter: BookingFilter = {}): BookingRecord[] {
    return this.memory
      .filter((booking) => (filter.propertyId ? booking.propertyId === filter.propertyId : true))
      .filter((booking) => (filter.status ? booking.status === filter.status : true))
      .sort((a, b) => a.checkIn.localeCompare(b.checkIn));
  }

  findById(id: string): BookingRecord | undefined {
    return this.memory.find((booking) => booking.id === id);
  }

  /**
   * Returns active bookings on the same property whose dates overlap the given
   * range. Cancelled and checked-out stays never block new reservations.
   */
  findConflicts(
    propertyId: string,
    range: { checkIn: string; checkOut: string },
    excludeId?: string
  ): BookingRecord[] {
    return this.memory.filter(
      (booking) =>
        booking.id !== excludeId &&
        booking.propertyId === propertyId &&
        STATUSES_THAT_BLOCK_DATES.has(booking.status) &&
        bookingDatesOverlap(booking, range)
    );
  }

  insert(record: BookingRecord): BookingRecord {
    this.memory.push(record);
    return record;
  }

  update(id: string, patch: Partial<BookingRecord>): BookingRecord | undefined {
    const booking = this.findById(id);
    if (!booking) return undefined;
    Object.assign(booking, patch, { updatedAt: new Date().toISOString() });
    return booking;
  }
}
