import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { createEntitySchema, entitySchema, MockCrudStore, statusSchema, updateEntitySchema } from '../../lib/mock-crud';

const paramsSchema = z.object({ id: z.string().uuid() });
const querySchema = z.object({ status: statusSchema.optional() });

const store = new MockCrudStore([
  { title: 'Publish weekly RevPAR snapshot', status: 'pending', priority: 'high' },
  { title: 'Validate occupancy anomaly', status: 'active', priority: 'medium' }
]);

export const analyticsRoutes: FastifyPluginAsync = async (app) => {
  app.get('/analytics', async (req) => {
    const query = querySchema.parse(req.query);
    return store.list(query.status);
  });

  app.get('/analytics/stats', async () => store.stats());

  app.post('/analytics', async (req, reply) => {
    const created = store.create(createEntitySchema.parse(req.body));
    return reply.code(201).send(entitySchema.parse(created));
  });

  app.patch('/analytics/:id', async (req, reply) => {
    const { id } = paramsSchema.parse(req.params);
    const updated = store.update(id, updateEntitySchema.parse(req.body));
    if (!updated) return reply.code(404).send({ message: 'Not found' });
    return entitySchema.parse(updated);
  });

  app.post('/analytics/:id/complete', async (req, reply) => {
    const { id } = paramsSchema.parse(req.params);
    const updated = store.markDone(id);
    if (!updated) return reply.code(404).send({ message: 'Not found' });
    return entitySchema.parse(updated);
  });
};
