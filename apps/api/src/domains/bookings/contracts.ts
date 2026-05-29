import { z } from 'zod';

// A booking moves through a strict lifecycle. New reservations land as
// `confirmed`; the on-property flow advances them to `checked_in` and then
// `checked_out`. Either of the active states can be `cancelled`.
export const bookingStatusSchema = z.enum(['confirmed', 'checked_in', 'checked_out', 'cancelled']);
export type BookingStatus = z.infer<typeof bookingStatusSchema>;

// Reservations can originate from OTA channels or direct bookings.
export const bookingSourceSchema = z.enum(['direct', 'airbnb', 'booking_com', 'vrbo']);
export type BookingSource = z.infer<typeof bookingSourceSchema>;

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expected date in YYYY-MM-DD format');

export const bookingSchema = z.object({
  id: z.string().uuid(),
  propertyId: z.string().uuid(),
  propertyName: z.string(),
  source: bookingSourceSchema,
  externalReservationId: z.string(),
  guestName: z.string().min(1),
  guestCount: z.number().int().positive(),
  checkIn: isoDate,
  checkOut: isoDate,
  status: bookingStatusSchema,
  totalAmount: z.number().nonnegative(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type BookingDto = z.infer<typeof bookingSchema>;

export const createBookingSchema = z
  .object({
    propertyId: z.string().uuid(),
    source: bookingSourceSchema.default('direct'),
    externalReservationId: z.string().min(1).optional(),
    guestName: z.string().min(1),
    guestCount: z.number().int().positive().default(1),
    checkIn: isoDate,
    checkOut: isoDate,
    totalAmount: z.number().nonnegative().default(0)
  })
  .refine((value) => value.checkOut > value.checkIn, {
    message: 'checkOut must be after checkIn',
    path: ['checkOut']
  });

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

export const bookingStatsSchema = z.object({
  total: z.number(),
  upcoming: z.number(),
  inHouse: z.number(),
  byStatus: z.record(z.number())
});

export type BookingStats = z.infer<typeof bookingStatsSchema>;

// Two date ranges overlap when each starts before the other ends. Checkout
// day equals the next guest's checkin day, so that boundary is NOT a conflict.
export function bookingDatesOverlap(
  a: { checkIn: string; checkOut: string },
  b: { checkIn: string; checkOut: string }
): boolean {
  return a.checkIn < b.checkOut && a.checkOut > b.checkIn;
}
