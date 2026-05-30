import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import Fastify, { type FastifyInstance } from "fastify";
import { ai_repliesRoutes } from "./domains/ai-replies/routes";
import { aiRoutes } from "./domains/ai/routes";
import { analyticsRoutes } from "./domains/analytics/routes";
import { authRoutes } from "./domains/auth/routes";
import { bookingsRoutes } from "./domains/bookings/routes";
import { calendarsRoutes } from "./domains/calendars/routes";
import { housekeepingRoutes } from "./domains/housekeeping/routes";
import { inventoryRoutes } from "./domains/inventory/routes";
import { maintenanceRoutes } from "./domains/maintenance/routes";
import { ordersRoutes } from "./domains/orders/routes";
import { propertiesRoutes } from "./domains/properties/routes";
import { vendorsRoutes } from "./domains/vendors/routes";
import { env } from "./lib/env";
import { authPlugin } from "./plugins/auth";
import { openApiPlugin } from "./plugins/openapi";

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: true });
  await app.register(cors, { origin: true });
  await app.register(rateLimit, { max: 200, timeWindow: "1 minute" });
  await app.register(openApiPlugin);
  await app.register(authPlugin);
  app.get("/health", async () => ({
    status: "ok",
    service: "superhostos-api",
    timestamp: new Date().toISOString(),
  }));
  await app.register(propertiesRoutes, { prefix: "/v1" });
  await app.register(bookingsRoutes, { prefix: "/v1" });
  await app.register(calendarsRoutes, { prefix: "/v1" });
  await app.register(housekeepingRoutes, { prefix: "/v1" });
  await app.register(maintenanceRoutes, { prefix: "/v1" });
  await app.register(vendorsRoutes, { prefix: "/v1" });
  await app.register(ordersRoutes, { prefix: "/v1" });
  await app.register(ai_repliesRoutes, { prefix: "/v1" });
  await app.register(analyticsRoutes, { prefix: "/v1" });
  await app.register(authRoutes, { prefix: "/v1" });
  await app.register(inventoryRoutes, { prefix: "/v1" });
  await app.register(aiRoutes, { prefix: "/v1" });
  return app;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const app = await buildApp();
  await app.listen({ port: env.PORT, host: "0.0.0.0" });
}
