import type { FastifyPluginAsync } from 'fastify';
import { PropertiesRepository } from './repository';
import { PropertiesService } from './service';

export const propertiesRoutes: FastifyPluginAsync = async (app) => {
  const service = new PropertiesService(new PropertiesRepository());

  app.get('/properties', {
    schema: {
      tags: ['properties'],
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            // Properties must be enumerated or Fastify's serializer strips them.
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              city: { type: 'string' },
              timezone: { type: 'string' },
              isActive: { type: 'boolean' }
            }
          }
        }
      }
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
    const property = await service.create(req.body);
    return reply.code(201).send(property);
  });
};
