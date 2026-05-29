import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { bookingStatusSchema } from './contracts';
import { BookingError, BookingsService } from './service';

const paramsSchema = z.object({ id: z.string().uuid() });
const querySchema = z.object({
  propertyId: z.string().uuid().optional(),
  status: bookingStatusSchema.optional()
});

export const bookingsRoutes: FastifyPluginAsync = async (app) => {
  const service = new BookingsService();

  // Encapsulated to this plugin: map domain + validation errors to HTTP codes.
  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof BookingError) {
      return reply.code(error.statusCode).send({ message: error.message, details: error.details });
    }
    if (error instanceof z.ZodError) {
      return reply.code(400).send({ message: 'Validation failed', details: error.issues });
    }
    app.log.error(error);
    return reply.code(500).send({ message: 'Internal server error' });
  });

  app.get('/bookings', { schema: { tags: ['bookings'] } }, async (req) => {
    const query = querySchema.parse(req.query);
    return service.list(query);
  });

  app.get('/bookings/stats', { schema: { tags: ['bookings'] } }, async (req) => {
    const query = querySchema.parse(req.query);
    return service.stats(query);
  });

  app.get('/bookings/:id', { schema: { tags: ['bookings'] } }, async (req) => {
    const { id } = paramsSchema.parse(req.params);
    return service.get(id);
  });

  app.post('/bookings', { schema: { tags: ['bookings'] } }, async (req, reply) => {
    const created = service.create(req.body);
    return reply.code(201).send(created);
  });

  app.post('/bookings/:id/check-in', { schema: { tags: ['bookings'] } }, async (req) => {
    const { id } = paramsSchema.parse(req.params);
    return service.checkIn(id);
  });

  app.post('/bookings/:id/check-out', { schema: { tags: ['bookings'] } }, async (req) => {
    const { id } = paramsSchema.parse(req.params);
    return service.checkOut(id);
  });

  app.post('/bookings/:id/cancel', { schema: { tags: ['bookings'] } }, async (req) => {
    const { id } = paramsSchema.parse(req.params);
    return service.cancel(id);
  });
};
