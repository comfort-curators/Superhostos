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
  { title: "Review pending org invite", status: "pending", priority: "medium" },
  { title: "Rotate support role access", status: "active", priority: "high" },
]);

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.get("/auth/tasks", async (req) => {
    const query = querySchema.parse(req.query);
    return store.list(query.status);
  });

  app.get("/auth/tasks/stats", async () => store.stats());

  app.post("/auth/tasks", async (req, reply) => {
    const created = store.create(createEntitySchema.parse(req.body));
    return reply.code(201).send(entitySchema.parse(created));
  });

  app.patch("/auth/tasks/:id", async (req, reply) => {
    const { id } = paramsSchema.parse(req.params);
    const updated = store.update(id, updateEntitySchema.parse(req.body));
    if (!updated) return reply.code(404).send({ message: "Not found" });
    return entitySchema.parse(updated);
  });

  app.post("/auth/tasks/:id/complete", async (req, reply) => {
    const { id } = paramsSchema.parse(req.params);
    const updated = store.markDone(id);
    if (!updated) return reply.code(404).send({ message: "Not found" });
    return entitySchema.parse(updated);
  });
};
