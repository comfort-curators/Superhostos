import { z } from 'zod';

const propertySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  city: z.string(),
  timezone: z.string(),
  isActive: z.boolean()
});

const opsItemSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  status: z.enum(['pending', 'active', 'done', 'blocked']),
  priority: z.enum(['low', 'medium', 'high']),
  notes: z.string(),
  dueDate: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string()
});

const opsStatsSchema = z.object({ total: z.number(), byStatus: z.record(z.number()) });

export type PropertyDto = z.infer<typeof propertySchema>;
export type OpsItemDto = z.infer<typeof opsItemSchema>;
export type OpsStatsDto = z.infer<typeof opsStatsSchema>;

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '';

async function request<T>(path: string, schema: z.ZodType<T>, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, { headers: { 'Content-Type': 'application/json' }, ...init });
  if (!response.ok) throw new Error(`API ${path} failed (${response.status})`);
  return schema.parse(await response.json());
}

export const fetchProperties = () => request('/v1/properties', z.array(propertySchema));
export const fetchOpsItems = (domain: string, status?: string) => request(`/v1/${domain}${status ? `?status=${status}` : ''}`, z.array(opsItemSchema));
export const fetchOpsStats = (domain: string) => request(`/v1/${domain}/stats`, opsStatsSchema);
export const createOpsItem = (domain: string, payload: { title: string; priority: 'low' | 'medium' | 'high' }) => request(`/v1/${domain}`, opsItemSchema, { method: 'POST', body: JSON.stringify(payload) });
export const updateOpsItem = (domain: string, id: string, payload: Partial<Pick<OpsItemDto, 'status' | 'priority' | 'notes'>>) => request(`/v1/${domain}/${id}`, opsItemSchema, { method: 'PATCH', body: JSON.stringify(payload) });
export const completeOpsItem = (domain: string, id: string) => request(`/v1/${domain}/${id}/complete`, opsItemSchema, { method: 'POST' });
