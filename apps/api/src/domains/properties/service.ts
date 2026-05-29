import { z } from 'zod';
import type { PropertiesRepository } from './repository';

export const createPropertySchema = z.object({
  name: z.string().min(2),
  city: z.string().min(2),
  timezone: z.string().min(2)
});

export class PropertiesService {
  constructor(private readonly repository: PropertiesRepository) {}

  list() {
    return this.repository.list();
  }

  create(payload: unknown) {
    const parsed = createPropertySchema.parse(payload);
    return this.repository.create(parsed);
  }
}
