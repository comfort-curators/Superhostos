import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { GuestReplyService } from "./service";

export const aiRoutes: FastifyPluginAsync = async (app) => {
  const service = new GuestReplyService();

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof z.ZodError) {
      return reply
        .code(400)
        .send({ message: "Validation failed", details: error.issues });
    }
    app.log.error(error);
    return reply.code(502).send({
      message: "AI generation failed",
      detail: error instanceof Error ? error.message : "unknown",
    });
  });

  // Generate a draft guest reply. Works with or without an AI key configured.
  app.post(
    "/ai/guest-reply",
    { schema: { tags: ["ai"] } },
    async (req, reply) => {
      const result = await service.generate(req.body);
      return reply.code(200).send(result);
    },
  );

  app.get("/ai/status", { schema: { tags: ["ai"] } }, async () => ({
    provider: process.env.DO_INFERENCE_API_KEY ? "digitalocean" : "fallback",
    model: process.env.DO_INFERENCE_MODEL ?? "llama3.3-70b-instruct",
  }));
};
