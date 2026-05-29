import type { FastifyPluginAsync } from 'fastify';
import { PropertiesRepository } from './repository';
import { createPropertySchema, PropertiesService } from './service';

export const propertiesRoutes: FastifyPluginAsync = async (app) => {
  const service = new PropertiesService(new PropertiesRepository());

  app.get('/properties', {
    schema: {
      tags: ['properties'],
      response: { 200: { type: 'array', items: { type: 'object' } } }
    }
  }, async () => service.list());

  app.post('/properties', {
    schema: {
      tags: ['properties'],
      body: {
        type: 'object',
        required: ['name', 'city', 'timezone'],
        properties: {
          name: { type: 'string' },
          city: { type: 'string' },
          timezone: { type: 'string' }
        }
      }
    }
  }, async (req, reply) => {
    const property = service.create(createPropertySchema.parse(req.body));
    return reply.code(201).send(property);
  });
};
