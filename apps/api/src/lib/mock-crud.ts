import { z } from 'zod';

export const statusSchema = z.enum(['pending', 'active', 'done', 'blocked']);

export const entitySchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  status: statusSchema,
  priority: z.enum(['low', 'medium', 'high']),
  notes: z.string().default(''),
  dueDate: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const createEntitySchema = z.object({
  title: z.string().min(1),
  status: statusSchema.optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  notes: z.string().optional(),
  dueDate: z.string().nullable().optional()
});

export const updateEntitySchema = createEntitySchema.partial();

export type Entity = z.infer<typeof entitySchema>;

export class MockCrudStore {
  private readonly items: Entity[];

  constructor(seed: Array<Pick<Entity, 'title' | 'status' | 'priority'>>) {
    this.items = seed.map((item) => {
      const now = new Date().toISOString();
      return {
        id: crypto.randomUUID(),
        title: item.title,
        status: item.status,
        priority: item.priority,
        notes: '',
        dueDate: null,
        createdAt: now,
        updatedAt: now
      };
    });
  }

  list(status?: z.infer<typeof statusSchema>) {
    return status ? this.items.filter((item) => item.status === status) : this.items;
  }

  stats() {
    const total = this.items.length;
    const byStatus = this.items.reduce<Record<string, number>>((acc, item) => {
      acc[item.status] = (acc[item.status] ?? 0) + 1;
      return acc;
    }, {});
    return { total, byStatus };
  }

  create(payload: z.infer<typeof createEntitySchema>) {
    const now = new Date().toISOString();
    const entity: Entity = {
      id: crypto.randomUUID(),
      title: payload.title,
      status: payload.status ?? 'pending',
      priority: payload.priority ?? 'medium',
      notes: payload.notes ?? '',
      dueDate: payload.dueDate ?? null,
      createdAt: now,
      updatedAt: now
    };
    this.items.unshift(entity);
    return entity;
  }

  update(id: string, payload: z.infer<typeof updateEntitySchema>) {
    const item = this.items.find((entry) => entry.id === id);
    if (!item) return null;
    Object.assign(item, payload, { updatedAt: new Date().toISOString() });
    return item;
  }

  markDone(id: string) {
    return this.update(id, { status: 'done' });
  }
}
