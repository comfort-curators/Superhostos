import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { executeBodySchema, planQuerySchema } from "./contracts";
import { InventoryError, InventoryService } from "./service";

const itemsQuerySchema = z.object({ propertyId: z.string().uuid().optional() });

// Single service instance so the shared memory layer (budget ledger,
// RL reliability weights) persists across requests.
const service = new InventoryService();

const AGENTS = [
  {
    role: "Inventory Agent",
    responsibility:
      "Forecasts demand from base usage, occupancy and seasonality; sizes safety stock and reorder quantity.",
  },
  {
    role: "Booking Agent",
    responsibility:
      "Derives forward occupancy from the bookings domain and publishes it as a demand signal.",
  },
  {
    role: "Vendor Agent",
    responsibility:
      "Scores vendors on price, lead time and reliability; selects via softmax(exp(beta*U)) and reports confidence/entropy.",
  },
  {
    role: "Finance Agent",
    responsibility:
      "Enforces the per-cycle budget as a hard constraint, reducing quantities to fit when needed.",
  },
];

export const inventoryRoutes: FastifyPluginAsync = async (app) => {
  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof InventoryError) {
      return reply.code(error.statusCode).send({ message: error.message });
    }
    if (error instanceof z.ZodError) {
      return reply
        .code(400)
        .send({ message: "Validation failed", details: error.issues });
    }
    app.log.error(error);
    return reply.code(500).send({ message: "Internal server error" });
  });

  app.get("/inventory", { schema: { tags: ["inventory"] } }, async (req) => {
    const { propertyId } = itemsQuerySchema.parse(req.query);
    return service.listItems(propertyId);
  });

  app.get(
    "/inventory/agents",
    { schema: { tags: ["inventory"] } },
    async () => ({ agents: AGENTS }),
  );

  app.get(
    "/inventory/plan",
    { schema: { tags: ["inventory"] } },
    async (req) => {
      const { propertyId, horizonDays } = planQuerySchema.parse(req.query);
      return service.plan(propertyId, horizonDays);
    },
  );

  app.post(
    "/inventory/execute",
    { schema: { tags: ["inventory"] } },
    async (req, reply) => {
      const { propertyId, horizonDays, simulateOutcome, override } =
        executeBodySchema.parse(req.body);
      const orders = await service.execute(
        propertyId,
        horizonDays,
        simulateOutcome,
        override,
      );
      return reply.code(201).send({ propertyId, orders });
    },
  );

  // Shared contextual memory: current state + queryable versioned log.
  app.get(
    "/inventory/memory",
    { schema: { tags: ["inventory"] } },
    async () => {
      const memory = service.sharedMemory();
      const snapshot = memory.snapshot();
      return {
        version: snapshot.version,
        beta: snapshot.beta,
        reliability: snapshot.reliability,
        spend: snapshot.spend,
        agentWeights: snapshot.agentWeights,
        log: snapshot.log.slice(-25),
      };
    },
  );
};
