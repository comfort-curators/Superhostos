// This file is auto-generated. Do not edit manually.
import { pgTable, uuid, text, integer, timestamp, pgEnum, index } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Enums
export const riskLevelEnum = pgEnum('risk_level', ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'STOCKOUT']);
export const taskStatusEnum = pgEnum('task_status', ['scheduled', 'completed']);
export const maintenancePriorityEnum = pgEnum('maintenance_priority', ['low', 'medium', 'high']);
export const maintenanceStatusEnum = pgEnum('maintenance_status', ['open', 'completed']);
export const orderStatusEnum = pgEnum('order_status', ['pending', 'completed']);

// Properties
export const properties = pgTable('properties', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  city: text('city').notNull(),
  country: text('country').notNull(),
  bedrooms: integer('bedrooms').notNull(),
  maxGuests: integer('max_guests').notNull(),
  ownerName: text('owner_name').notNull(),
  amenities: text('amenities').array().notNull().default([]),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  nameIdx: index('idx_properties_name').on(table.name)
}));

export const insertPropertySchema = createInsertSchema(properties);
export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type Property = typeof properties.$inferSelect;

// Cleaning Tasks
export const cleaningTasks = pgTable('cleaning_tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  propertyId: uuid('property_id').notNull().references(() => properties.id),
  taskDate: timestamp('task_date').notNull(),
  status: taskStatusEnum('status').notNull().default('scheduled'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  propertyIdx: index('idx_cleaning_property').on(table.propertyId),
  dateIdx: index('idx_cleaning_date').on(table.taskDate)
}));

export const insertCleaningTaskSchema = createInsertSchema(cleaningTasks);
export type InsertCleaningTask = z.infer<typeof insertCleaningTaskSchema>;
export type CleaningTask = typeof cleaningTasks.$inferSelect;

// Maintenance Tasks
export const maintenanceTasks = pgTable('maintenance_tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  propertyId: uuid('property_id').notNull().references(() => properties.id),
  issue: text('issue').notNull(),
  priority: maintenancePriorityEnum('priority').notNull().default('medium'),
  status: maintenanceStatusEnum('status').notNull().default('open'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  propertyIdx: index('idx_maintenance_property').on(table.propertyId)
}));

export const insertMaintenanceTaskSchema = createInsertSchema(maintenanceTasks);
export type InsertMaintenanceTask = z.infer<typeof insertMaintenanceTaskSchema>;
export type MaintenanceTask = typeof maintenanceTasks.$inferSelect;

// Orders
export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  propertyId: uuid('property_id').notNull().references(() => properties.id),
  item: text('item').notNull(),
  quantity: integer('quantity').notNull(),
  status: orderStatusEnum('status').notNull().default('pending'),
  totalPrice: integer('total_price').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  propertyIdx: index('idx_orders_property').on(table.propertyId)
}));

export const insertOrderSchema = createInsertSchema(orders);
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

// Message Templates
export const messageTemplates = pgTable('message_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  trigger: text('trigger').notNull(),
  content: text('content').notNull(),
  active: text('active').notNull().default('true'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const insertMessageTemplateSchema = createInsertSchema(messageTemplates);
export type InsertMessageTemplate = z.infer<typeof insertMessageTemplateSchema>;
export type MessageTemplate = typeof messageTemplates.$inferSelect;