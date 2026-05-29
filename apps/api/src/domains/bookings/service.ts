import { randomUUID } from 'node:crypto';
import {
  type BookingDto,
  type BookingStats,
  type BookingStatus,
  type CreateBookingInput,
  createBookingSchema
} from './contracts';
import { PropertiesRepository } from '../properties/repository';
import { BookingsRepository, type BookingFilter, type BookingRecord } from './repository';

/** Raised when a requested operation cannot be satisfied; carries an HTTP code. */
export class BookingError extends Error {
  constructor(
    readonly statusCode: number,
    message: string,
    readonly details?: unknown
  ) {
    super(message);
    this.name = 'BookingError';
  }
}

// Allowed status transitions. A booking can only move along these edges.
const TRANSITIONS: Record<BookingStatus, ReadonlyArray<BookingStatus>> = {
  confirmed: ['checked_in', 'cancelled'],
  checked_in: ['checked_out', 'cancelled'],
  checked_out: [],
  cancelled: []
};

export class BookingsService {
  constructor(
    private readonly repository: BookingsRepository = new BookingsRepository(),
    private readonly properties: PropertiesRepository = new PropertiesRepository()
  ) {}

  list(filter: BookingFilter = {}): BookingDto[] {
    return this.repository.list(filter).map((record) => this.toContract(record));
  }

  get(id: string): BookingDto {
    return this.toContract(this.requireBooking(id));
  }

  create(input: unknown): BookingDto {
    const payload: CreateBookingInput = createBookingSchema.parse(input);

    if (!this.properties.findById(payload.propertyId)) {
      throw new BookingError(404, `Property ${payload.propertyId} not found`);
    }

    const conflicts = this.repository.findConflicts(payload.propertyId, payload);
    if (conflicts.length > 0) {
      throw new BookingError(409, 'Booking dates conflict with an existing reservation', {
        conflicts: conflicts.map((conflict) => ({
          id: conflict.id,
          checkIn: conflict.checkIn,
          checkOut: conflict.checkOut,
          externalReservationId: conflict.externalReservationId
        }))
      });
    }

    const now = new Date().toISOString();
    const record: BookingRecord = {
      id: randomUUID(),
      propertyId: payload.propertyId,
      source: payload.source,
      externalReservationId: payload.externalReservationId ?? `SHO-${randomUUID().slice(0, 8).toUpperCase()}`,
      guestName: payload.guestName,
      guestCount: payload.guestCount,
      checkIn: payload.checkIn,
      checkOut: payload.checkOut,
      status: 'confirmed',
      totalAmount: payload.totalAmount,
      createdAt: now,
      updatedAt: now
    };

    return this.toContract(this.repository.insert(record));
  }

  checkIn(id: string): BookingDto {
    return this.transition(id, 'checked_in');
  }

  checkOut(id: string): BookingDto {
    return this.transition(id, 'checked_out');
  }

  cancel(id: string): BookingDto {
    return this.transition(id, 'cancelled');
  }

  stats(filter: BookingFilter = {}): BookingStats {
    const bookings = this.repository.list(filter);
    const byStatus = bookings.reduce<Record<string, number>>((acc, booking) => {
      acc[booking.status] = (acc[booking.status] ?? 0) + 1;
      return acc;
    }, {});

    return {
      total: bookings.length,
      upcoming: byStatus.confirmed ?? 0,
      inHouse: byStatus.checked_in ?? 0,
      byStatus
    };
  }

  private transition(id: string, next: BookingStatus): BookingDto {
    const booking = this.requireBooking(id);
    if (!TRANSITIONS[booking.status].includes(next)) {
      throw new BookingError(409, `Cannot move booking from ${booking.status} to ${next}`);
    }
    const updated = this.repository.update(id, { status: next });
    if (!updated) throw new BookingError(404, `Booking ${id} not found`);
    return this.toContract(updated);
  }

  private requireBooking(id: string): BookingRecord {
    const booking = this.repository.findById(id);
    if (!booking) throw new BookingError(404, `Booking ${id} not found`);
    return booking;
  }

  private toContract(record: BookingRecord): BookingDto {
    const property = this.properties.findById(record.propertyId);
    return {
      ...record,
      propertyName: property?.name ?? 'Unknown property'
    };
  }
}
