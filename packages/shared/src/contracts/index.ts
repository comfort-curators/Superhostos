import { z } from 'zod';

export const propertySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2),
  city: z.string().min(2),
  timezone: z.string().min(2),
  isActive: z.boolean()
});

export type PropertyContract = z.infer<typeof propertySchema>;
