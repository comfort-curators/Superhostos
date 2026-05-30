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

// The persisted record already carries every field the contract exposes
// (propertyName is denormalised at write time), so this is a pass-through.
function toContract(record: BookingRecord): BookingDto {
  return { ...record };
}

export class BookingsService {
  constructor(
    private readonly repository: BookingsRepository = new BookingsRepository(),
    private readonly properties: PropertiesRepository = new PropertiesRepository()
  ) {}

  async list(filter: BookingFilter = {}): Promise<BookingDto[]> {
    return (await this.repository.list(filter)).map(toContract);
  }

  async get(id: string): Promise<BookingDto> {
    return toContract(await this.requireBooking(id));
  }

  async create(input: unknown): Promise<BookingDto> {
    const payload: CreateBookingInput = createBookingSchema.parse(input);

    const property = await this.properties.findById(payload.propertyId);
    if (!property) {
      throw new BookingError(404, `Property ${payload.propertyId} not found`);
    }

    const conflicts = await this.repository.findConflicts(payload.propertyId, payload);
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
      propertyName: property.name,
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

    return toContract(await this.repository.insert(record));
  }

  checkIn(id: string): Promise<BookingDto> {
    return this.transition(id, 'checked_in');
  }

  checkOut(id: string): Promise<BookingDto> {
    return this.transition(id, 'checked_out');
  }

  cancel(id: string): Promise<BookingDto> {
    return this.transition(id, 'cancelled');
  }

  async stats(filter: BookingFilter = {}): Promise<BookingStats> {
    const bookings = await this.repository.list(filter);
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

  private async transition(id: string, next: BookingStatus): Promise<BookingDto> {
    const booking = await this.requireBooking(id);
    if (!TRANSITIONS[booking.status].includes(next)) {
      throw new BookingError(409, `Cannot move booking from ${booking.status} to ${next}`);
    }
    const updated = await this.repository.update(id, { status: next });
    if (!updated) throw new BookingError(404, `Booking ${id} not found`);
    return toContract(updated);
  }

  private async requireBooking(id: string): Promise<BookingRecord> {
    const booking = await this.repository.findById(id);
    if (!booking) throw new BookingError(404, `Booking ${id} not found`);
    return booking;
  }
}
