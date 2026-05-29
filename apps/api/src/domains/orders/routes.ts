import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { createEntitySchema, entitySchema, MockCrudStore, statusSchema, updateEntitySchema } from '../../lib/mock-crud';

const paramsSchema = z.object({ id: z.string().uuid() });
const querySchema = z.object({ status: statusSchema.optional() });

const store = new MockCrudStore([
  { title: 'Order shampoo refill batch', status: 'pending', priority: 'medium' },
  { title: 'Replace broken lockbox stock', status: 'active', priority: 'high' }
]);

export const ordersRoutes: FastifyPluginAsync = async (app) => {
  app.get('/orders', async (req) => {
    const query = querySchema.parse(req.query);
    return store.list(query.status);
  });

  app.get('/orders/stats', async () => store.stats());

  app.post('/orders', async (req, reply) => {
    const created = store.create(createEntitySchema.parse(req.body));
    return reply.code(201).send(entitySchema.parse(created));
  });

  app.patch('/orders/:id', async (req, reply) => {
    const { id } = paramsSchema.parse(req.params);
    const updated = store.update(id, updateEntitySchema.parse(req.body));
    if (!updated) return reply.code(404).send({ message: 'Not found' });
    return entitySchema.parse(updated);
  });

  app.post('/orders/:id/complete', async (req, reply) => {
    const { id } = paramsSchema.parse(req.params);
    const updated = store.markDone(id);
    if (!updated) return reply.code(404).send({ message: 'Not found' });
    return entitySchema.parse(updated);
  });
};
