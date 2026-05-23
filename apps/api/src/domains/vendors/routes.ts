import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { createEntitySchema, entitySchema, MockCrudStore, statusSchema, updateEntitySchema } from '../../lib/mock-crud';

const paramsSchema = z.object({ id: z.string().uuid() });
const querySchema = z.object({ status: statusSchema.optional() });

const store = new MockCrudStore([
  { title: 'Renew cleaning vendor contract', status: 'pending', priority: 'medium' },
  { title: 'Approve emergency plumber', status: 'active', priority: 'high' }
]);

export const vendorsRoutes: FastifyPluginAsync = async (app) => {
  app.get('/vendors', async (req) => {
    const query = querySchema.parse(req.query);
    return store.list(query.status);
  });

  app.get('/vendors/stats', async () => store.stats());

  app.post('/vendors', async (req, reply) => {
    const created = store.create(createEntitySchema.parse(req.body));
    return reply.code(201).send(entitySchema.parse(created));
  });

  app.patch('/vendors/:id', async (req, reply) => {
    const { id } = paramsSchema.parse(req.params);
    const updated = store.update(id, updateEntitySchema.parse(req.body));
    if (!updated) return reply.code(404).send({ message: 'Not found' });
    return entitySchema.parse(updated);
  });

  app.post('/vendors/:id/complete', async (req, reply) => {
    const { id } = paramsSchema.parse(req.params);
    const updated = store.markDone(id);
    if (!updated) return reply.code(404).send({ message: 'Not found' });
    return entitySchema.parse(updated);
  });
};
