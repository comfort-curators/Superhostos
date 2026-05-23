import { randomUUID } from 'node:crypto';

export interface PropertyRecord {
  id: string;
  name: string;
  city: string;
  timezone: string;
  isActive: boolean;
}

const memory: PropertyRecord[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Nobu Penthouse',
    city: 'Los Angeles',
    timezone: 'America/Los_Angeles',
    isActive: true
  }
];

export class PropertiesRepository {
  list(): PropertyRecord[] {
    return memory;
  }

  create(input: Omit<PropertyRecord, 'id' | 'isActive'>): PropertyRecord {
    const created: PropertyRecord = { id: randomUUID(), isActive: true, ...input };
    memory.push(created);
    return created;
  }
}
