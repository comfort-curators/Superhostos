import { randomUUID } from 'node:crypto';
import { and, eq, gt, inArray, lt, ne } from 'drizzle-orm';
import { getDb } from '../../db/client';
import { bookings as bookingsTable } from '../../db/schema';
import { bookingDatesOverlap, type BookingSource, type BookingStatus } from './contracts';

export interface BookingRecord {
  id: string;
  propertyId: string;
  propertyName: string;
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

const BLOCKING_STATUSES: BookingStatus[] = ['confirmed', 'checked_in'];

type Row = typeof bookingsTable.$inferSelect;

function rowToRecord(row: Row): BookingRecord {
  return {
    id: row.id,
    propertyId: row.propertyId,
    propertyName: row.propertyName,
    source: row.source,
    externalReservationId: row.externalReservationId,
    guestName: row.guestName,
    guestCount: row.guestCount,
    checkIn: row.checkIn,
    checkOut: row.checkOut,
    status: row.status,
    totalAmount: row.totalAmount,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

function seed(): BookingRecord[] {
  const now = new Date().toISOString();
  const make = (record: Omit<BookingRecord, 'id' | 'createdAt' | 'updatedAt'>): BookingRecord => ({
    id: randomUUID(),
    createdAt: now,
    updatedAt: now,
    ...record
  });
  return [
    make({ propertyId: '00000000-0000-0000-0000-000000000001', propertyName: 'Nobu Penthouse', source: 'airbnb', externalReservationId: 'AIRBNB-1023', guestName: 'Dana Whitfield', guestCount: 2, checkIn: '2026-06-02', checkOut: '2026-06-06', status: 'confirmed', totalAmount: 1840 }),
    make({ propertyId: '00000000-0000-0000-0000-000000000002', propertyName: 'Palm Loft', source: 'booking_com', externalReservationId: 'BKG-55120', guestName: 'Marcus Lee', guestCount: 4, checkIn: '2026-05-28', checkOut: '2026-05-31', status: 'checked_in', totalAmount: 1290 }),
    make({ propertyId: '00000000-0000-0000-0000-000000000003', propertyName: 'Cedar Cabin', source: 'direct', externalReservationId: 'DIR-0007', guestName: 'Priya Nair', guestCount: 3, checkIn: '2026-06-10', checkOut: '2026-06-14', status: 'confirmed', totalAmount: 2120 })
  ];
}

/**
 * Bookings persistence. Uses Postgres (Drizzle) when DATABASE_URL is set;
 * otherwise an in-memory store seeded with sample data for dev/tests/demos.
 */
export class BookingsRepository {
  private readonly memory: BookingRecord[] = getDb() ? [] : seed();

  async list(filter: BookingFilter = {}): Promise<BookingRecord[]> {
    const db = getDb();
    if (!db) {
      return this.memory
        .filter((b) => (filter.propertyId ? b.propertyId === filter.propertyId : true))
        .filter((b) => (filter.status ? b.status === filter.status : true))
        .sort((a, b) => a.checkIn.localeCompare(b.checkIn));
    }
    const conditions = [
      filter.propertyId ? eq(bookingsTable.propertyId, filter.propertyId) : undefined,
      filter.status ? eq(bookingsTable.status, filter.status) : undefined
    ].filter((c): c is NonNullable<typeof c> => c !== undefined);
    const rows = await db
      .select()
      .from(bookingsTable)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(bookingsTable.checkIn);
    return rows.map(rowToRecord);
  }

  async findById(id: string): Promise<BookingRecord | undefined> {
    const db = getDb();
    if (!db) return this.memory.find((b) => b.id === id);
    const [row] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, id)).limit(1);
    return row ? rowToRecord(row) : undefined;
  }

  /**
   * Active bookings on the same property whose dates overlap the given range.
   * Cancelled and checked-out stays never block new reservations.
   */
  async findConflicts(propertyId: string, range: { checkIn: string; checkOut: string }, excludeId?: string): Promise<BookingRecord[]> {
    const db = getDb();
    if (!db) {
      return this.memory.filter(
        (b) =>
          b.id !== excludeId &&
          b.propertyId === propertyId &&
          BLOCKING_STATUSES.includes(b.status) &&
          bookingDatesOverlap(b, range)
      );
    }
    const conditions = [
      eq(bookingsTable.propertyId, propertyId),
      inArray(bookingsTable.status, BLOCKING_STATUSES),
      lt(bookingsTable.checkIn, range.checkOut),
      gt(bookingsTable.checkOut, range.checkIn),
      excludeId ? ne(bookingsTable.id, excludeId) : undefined
    ].filter((c): c is NonNullable<typeof c> => c !== undefined);
    const rows = await db.select().from(bookingsTable).where(and(...conditions));
    return rows.map(rowToRecord);
  }

  async insert(record: BookingRecord): Promise<BookingRecord> {
    const db = getDb();
    if (!db) {
      this.memory.push(record);
      return record;
    }
    const [row] = await db
      .insert(bookingsTable)
      .values({
        id: record.id,
        propertyId: record.propertyId,
        propertyName: record.propertyName,
        source: record.source,
        externalReservationId: record.externalReservationId,
        guestName: record.guestName,
        guestCount: record.guestCount,
        checkIn: record.checkIn,
        checkOut: record.checkOut,
        status: record.status,
        totalAmount: record.totalAmount,
        createdAt: new Date(record.createdAt),
        updatedAt: new Date(record.updatedAt)
      })
      .returning();
    return rowToRecord(row as Row);
  }

  async update(id: string, patch: Partial<BookingRecord>): Promise<BookingRecord | undefined> {
    const db = getDb();
    if (!db) {
      const booking = this.memory.find((b) => b.id === id);
      if (!booking) return undefined;
      Object.assign(booking, patch, { updatedAt: new Date().toISOString() });
      return booking;
    }
    const [row] = await db
      .update(bookingsTable)
      .set({ ...(patch.status ? { status: patch.status } : {}), updatedAt: new Date() })
      .where(eq(bookingsTable.id, id))
      .returning();
    return row ? rowToRecord(row as Row) : undefined;
  }
}
