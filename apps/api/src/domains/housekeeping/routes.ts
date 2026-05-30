import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import {
  MockCrudStore,
  createEntitySchema,
  entitySchema,
  statusSchema,
  updateEntitySchema,
} from "../../lib/mock-crud";

const paramsSchema = z.object({ id: z.string().uuid() });
const querySchema = z.object({ status: statusSchema.optional() });

const store = new MockCrudStore([
  { title: "Turnover for Palm Loft", status: "pending", priority: "high" },
  { title: "Linen restock audit", status: "active", priority: "medium" },
]);

export const housekeepingRoutes: FastifyPluginAsync = async (app) => {
  app.get("/housekeeping", async (req) => {
    const query = querySchema.parse(req.query);
    return store.list(query.status);
  });

  app.get("/housekeeping/stats", async () => store.stats());

  app.post("/housekeeping", async (req, reply) => {
    const created = store.create(createEntitySchema.parse(req.body));
    return reply.code(201).send(entitySchema.parse(created));
  });

  app.patch("/housekeeping/:id", async (req, reply) => {
    const { id } = paramsSchema.parse(req.params);
    const updated = store.update(id, updateEntitySchema.parse(req.body));
    if (!updated) return reply.code(404).send({ message: "Not found" });
    return entitySchema.parse(updated);
  });

  app.post("/housekeeping/:id/complete", async (req, reply) => {
    const { id } = paramsSchema.parse(req.params);
    const updated = store.markDone(id);
    if (!updated) return reply.code(404).send({ message: "Not found" });
    return entitySchema.parse(updated);
  });
};
