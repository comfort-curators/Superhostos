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
  {
    title: "Reply to late checkout request",
    status: "pending",
    priority: "medium",
  },
  {
    title: "Draft noise complaint follow-up",
    status: "active",
    priority: "high",
  },
]);

export const ai_repliesRoutes: FastifyPluginAsync = async (app) => {
  app.get("/ai-replies", async (req) => {
    const query = querySchema.parse(req.query);
    return store.list(query.status);
  });

  app.get("/ai-replies/stats", async () => store.stats());

  app.post("/ai-replies", async (req, reply) => {
    const created = store.create(createEntitySchema.parse(req.body));
    return reply.code(201).send(entitySchema.parse(created));
  });

  app.patch("/ai-replies/:id", async (req, reply) => {
    const { id } = paramsSchema.parse(req.params);
    const updated = store.update(id, updateEntitySchema.parse(req.body));
    if (!updated) return reply.code(404).send({ message: "Not found" });
    return entitySchema.parse(updated);
  });

  app.post("/ai-replies/:id/complete", async (req, reply) => {
    const { id } = paramsSchema.parse(req.params);
    const updated = store.markDone(id);
    if (!updated) return reply.code(404).send({ message: "Not found" });
    return entitySchema.parse(updated);
  });
};
