import { z } from "zod";

export const env = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    PORT: z.coerce.number().default(4000),
    REDIS_URL: z.string().url(),
    CLERK_SECRET_KEY: z.string().min(1),
  })
  .parse(process.env);
