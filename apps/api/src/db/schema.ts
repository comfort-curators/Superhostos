import { boolean, date, doublePrecision, integer, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

// Mirrors the booking lifecycle and reservation sources used by the domain.
export const bookingStatusEnum = pgEnum('booking_status', ['confirmed', 'checked_in', 'checked_out', 'cancelled']);
export const bookingSourceEnum = pgEnum('booking_source', ['direct', 'airbnb', 'booking_com', 'vrbo']);

export const properties = pgTable('properties', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  city: text('city').notNull(),
  timezone: text('timezone').notNull(),
  isActive: boolean('is_active').notNull().default(true)
});

export const bookings = pgTable('bookings', {
  id: uuid('id').primaryKey().defaultRandom(),
  propertyId: uuid('property_id').notNull(),
  // Denormalised so reads never need a join/cross-domain lookup.
  propertyName: text('property_name').notNull(),
  source: bookingSourceEnum('source').notNull(),
  externalReservationId: text('external_reservation_id').notNull(),
  guestName: text('guest_name').notNull(),
  guestCount: integer('guest_count').notNull(),
  // Stored as calendar dates (YYYY-MM-DD), surfaced as strings.
  checkIn: date('check_in', { mode: 'string' }).notNull(),
  checkOut: date('check_out', { mode: 'string' }).notNull(),
  status: bookingStatusEnum('status').notNull().default('confirmed'),
  totalAmount: doublePrecision('total_amount').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});
