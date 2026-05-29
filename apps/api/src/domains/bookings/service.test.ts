import { describe, expect, it } from 'vitest';
import { PropertiesRepository } from '../properties/repository';
import { BookingsRepository } from './repository';
import { BookingError, BookingsService } from './service';

const PROPERTY = '00000000-0000-0000-0000-000000000001';

function freshService() {
  return new BookingsService(new BookingsRepository(), new PropertiesRepository());
}

const base = {
  propertyId: PROPERTY,
  source: 'direct' as const,
  guestName: 'Test Guest',
  guestCount: 2,
  checkIn: '2026-09-01',
  checkOut: '2026-09-05',
  totalAmount: 500
};

describe('BookingsService.create', () => {
  it('creates a confirmed booking and assigns a reservation id', () => {
    const service = freshService();
    const booking = service.create(base);
    expect(booking.status).toBe('confirmed');
    expect(booking.externalReservationId).toMatch(/^SHO-/);
    expect(booking.propertyName).toBe('Nobu Penthouse');
  });

  it('rejects an unknown property with a 404', () => {
    const service = freshService();
    expect(() => service.create({ ...base, propertyId: '00000000-0000-0000-0000-0000000000ff' })).toThrow(
      BookingError
    );
  });

  it('rejects overlapping dates on the same property with a 409', () => {
    const service = freshService();
    service.create(base);
    try {
      service.create({ ...base, checkIn: '2026-09-03', checkOut: '2026-09-07' });
      throw new Error('expected conflict');
    } catch (error) {
      expect(error).toBeInstanceOf(BookingError);
      expect((error as BookingError).statusCode).toBe(409);
    }
  });

  it('allows a same-day turnover (checkout day == next checkin day)', () => {
    const service = freshService();
    service.create(base); // 09-01 -> 09-05
    const next = service.create({ ...base, checkIn: '2026-09-05', checkOut: '2026-09-08' });
    expect(next.status).toBe('confirmed');
  });

  it('allows overlapping dates on a different property', () => {
    const service = freshService();
    service.create(base);
    const other = service.create({ ...base, propertyId: '00000000-0000-0000-0000-000000000002' });
    expect(other.propertyName).toBe('Palm Loft');
  });

  it('lets a cancelled booking free up its dates', () => {
    const service = freshService();
    const first = service.create(base);
    service.cancel(first.id);
    const reused = service.create(base);
    expect(reused.status).toBe('confirmed');
  });
});

describe('BookingsService lifecycle', () => {
  it('advances confirmed -> checked_in -> checked_out', () => {
    const service = freshService();
    const booking = service.create(base);
    expect(service.checkIn(booking.id).status).toBe('checked_in');
    expect(service.checkOut(booking.id).status).toBe('checked_out');
  });

  it('rejects an invalid transition with a 409', () => {
    const service = freshService();
    const booking = service.create(base);
    expect(() => service.checkOut(booking.id)).toThrow(BookingError); // confirmed -> checked_out not allowed
  });

  it('cannot cancel a checked_out booking', () => {
    const service = freshService();
    const booking = service.create(base);
    service.checkIn(booking.id);
    service.checkOut(booking.id);
    expect(() => service.cancel(booking.id)).toThrow(BookingError);
  });
});

describe('BookingsService.stats', () => {
  it('summarises bookings by status', () => {
    const service = freshService();
    const stats = service.stats();
    expect(stats.total).toBeGreaterThan(0);
    expect(stats.upcoming).toBe(stats.byStatus.confirmed ?? 0);
    expect(stats.inHouse).toBe(stats.byStatus.checked_in ?? 0);
  });
});
