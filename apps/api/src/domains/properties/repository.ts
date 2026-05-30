import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { getDb } from '../../db/client';
import { properties as propertiesTable } from '../../db/schema';

export interface PropertyRecord {
  id: string;
  name: string;
  city: string;
  timezone: string;
  isActive: boolean;
}

type Row = typeof propertiesTable.$inferSelect;
const rowToRecord = (r: Row): PropertyRecord => ({ id: r.id, name: r.name, city: r.city, timezone: r.timezone, isActive: r.isActive });

// Shared in-memory store (used only when DATABASE_URL is unset). Module-level so
// every repository instance sees the same data within a process — matching the
// DB-backed behaviour where all instances read one source of truth.
const memory: PropertyRecord[] = [
  { id: '00000000-0000-0000-0000-000000000001', name: 'Nobu Penthouse', city: 'Los Angeles', timezone: 'America/Los_Angeles', isActive: true },
  { id: '00000000-0000-0000-0000-000000000002', name: 'Palm Loft', city: 'Miami', timezone: 'America/New_York', isActive: true },
  { id: '00000000-0000-0000-0000-000000000003', name: 'Cedar Cabin', city: 'Aspen', timezone: 'America/Denver', isActive: true }
];

export class PropertiesRepository {
  async list(): Promise<PropertyRecord[]> {
    const db = getDb();
    if (!db) return memory;
    return (await db.select().from(propertiesTable).orderBy(propertiesTable.name)).map(rowToRecord);
  }

  async findById(id: string): Promise<PropertyRecord | undefined> {
    const db = getDb();
    if (!db) return memory.find((property) => property.id === id);
    const [row] = await db.select().from(propertiesTable).where(eq(propertiesTable.id, id)).limit(1);
    return row ? rowToRecord(row) : undefined;
  }

  async create(input: Omit<PropertyRecord, 'id' | 'isActive'>): Promise<PropertyRecord> {
    const db = getDb();
    if (!db) {
      const created: PropertyRecord = { id: randomUUID(), isActive: true, ...input };
      memory.push(created);
      return created;
    }
    const [row] = await db.insert(propertiesTable).values({ ...input, isActive: true }).returning();
    return rowToRecord(row as Row);
  }
}
