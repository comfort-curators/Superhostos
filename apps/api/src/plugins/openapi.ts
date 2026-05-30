import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import type { FastifyPluginAsync } from "fastify";
export const openApiPlugin: FastifyPluginAsync = async (app) => {
  await app.register(swagger, {
    openapi: { info: { title: "SuperhostOS API", version: "0.1.0" } },
  });
  await app.register(swaggerUi, { routePrefix: "/docs" });
};
