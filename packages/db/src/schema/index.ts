import { boolean, index, integer, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

const audit = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  createdBy: text('created_by').notNull(),
  updatedBy: text('updated_by').notNull()
};

export const taskStatusEnum = pgEnum('task_status', ['pending', 'in_progress', 'completed', 'cancelled']);
export const users = pgTable('users', { id: uuid('id').primaryKey().defaultRandom(), clerkUserId: text('clerk_user_id').notNull().unique(), email: text('email').notNull(), role: text('role').notNull(), ...audit });
export const properties = pgTable('properties', { id: uuid('id').primaryKey().defaultRandom(), organizationId: text('organization_id').notNull(), name: text('name').notNull(), city: text('city').notNull(), isActive: boolean('is_active').notNull().default(true), ...audit }, (t) => [index('idx_properties_org').on(t.organizationId)]);
export const bookings = pgTable('bookings', { id: uuid('id').primaryKey().defaultRandom(), propertyId: uuid('property_id').notNull(), sourceId: uuid('source_id').notNull(), externalReservationId: text('external_reservation_id').notNull(), checkIn: timestamp('check_in', { withTimezone: true }).notNull(), checkOut: timestamp('check_out', { withTimezone: true }).notNull(), guestCount: integer('guest_count').notNull(), ...audit });
export const bookingSources = pgTable('booking_sources', { id: uuid('id').primaryKey().defaultRandom(), propertyId: uuid('property_id').notNull(), provider: text('provider').notNull(), icalUrl: text('ical_url').notNull(), ...audit });
export const cleaningTasks = pgTable('cleaning_tasks', { id: uuid('id').primaryKey().defaultRandom(), propertyId: uuid('property_id').notNull(), status: taskStatusEnum('status').notNull(), scheduledFor: timestamp('scheduled_for', { withTimezone: true }).notNull(), ...audit });
export const maintenanceTasks = pgTable('maintenance_tasks', { id: uuid('id').primaryKey().defaultRandom(), propertyId: uuid('property_id').notNull(), status: taskStatusEnum('status').notNull(), title: text('title').notNull(), ...audit });
export const vendors = pgTable('vendors', { id: uuid('id').primaryKey().defaultRandom(), organizationId: text('organization_id').notNull(), name: text('name').notNull(), category: text('category').notNull(), ...audit });
export const vendorOrders = pgTable('vendor_orders', { id: uuid('id').primaryKey().defaultRandom(), vendorId: uuid('vendor_id').notNull(), propertyId: uuid('property_id').notNull(), status: text('status').notNull(), ...audit });
export const conversations = pgTable('conversations', { id: uuid('id').primaryKey().defaultRandom(), propertyId: uuid('property_id').notNull(), guestName: text('guest_name').notNull(), ...audit });
export const messages = pgTable('messages', { id: uuid('id').primaryKey().defaultRandom(), conversationId: uuid('conversation_id').notNull(), authorType: text('author_type').notNull(), body: text('body').notNull(), ...audit });
export const aiGenerations = pgTable('ai_generations', { id: uuid('id').primaryKey().defaultRandom(), messageId: uuid('message_id').notNull(), provider: text('provider').notNull(), promptTokens: integer('prompt_tokens').notNull(), completionTokens: integer('completion_tokens').notNull(), ...audit });
export const analyticsSnapshots = pgTable('analytics_snapshots', { id: uuid('id').primaryKey().defaultRandom(), propertyId: uuid('property_id').notNull(), occupancyRate: integer('occupancy_rate').notNull(), revpar: integer('revpar').notNull(), capturedAt: timestamp('captured_at', { withTimezone: true }).notNull(), ...audit });
