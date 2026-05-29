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

const bookingSchema = z.object({
  id: z.string().uuid(),
  propertyId: z.string().uuid(),
  propertyName: z.string(),
  source: z.enum(['direct', 'airbnb', 'booking_com', 'vrbo']),
  externalReservationId: z.string(),
  guestName: z.string(),
  guestCount: z.number(),
  checkIn: z.string(),
  checkOut: z.string(),
  status: z.enum(['confirmed', 'checked_in', 'checked_out', 'cancelled']),
  totalAmount: z.number(),
  createdAt: z.string(),
  updatedAt: z.string()
});

const bookingStatsSchema = z.object({
  total: z.number(),
  upcoming: z.number(),
  inHouse: z.number(),
  byStatus: z.record(z.number())
});

export type BookingDto = z.infer<typeof bookingSchema>;
export type BookingStatsDto = z.infer<typeof bookingStatsSchema>;
export type BookingSource = BookingDto['source'];

export interface CreateBookingInput {
  propertyId: string;
  source: BookingSource;
  guestName: string;
  guestCount: number;
  checkIn: string;
  checkOut: string;
  totalAmount: number;
}

// Like `request`, but surfaces the API's error message (e.g. booking conflicts).
async function mutate<T>(path: string, schema: z.ZodType<T>, init: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, { headers: { 'Content-Type': 'application/json' }, ...init });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(body?.message ?? `API ${path} failed (${response.status})`);
  }
  return schema.parse(await response.json());
}

export const fetchBookings = (status?: string) =>
  request(`/v1/bookings${status && status !== 'all' ? `?status=${status}` : ''}`, z.array(bookingSchema));
export const fetchBookingStats = () => request('/v1/bookings/stats', bookingStatsSchema);
export const createBooking = (payload: CreateBookingInput) =>
  mutate('/v1/bookings', bookingSchema, { method: 'POST', body: JSON.stringify(payload) });
export const checkInBooking = (id: string) => mutate(`/v1/bookings/${id}/check-in`, bookingSchema, { method: 'POST' });
export const checkOutBooking = (id: string) => mutate(`/v1/bookings/${id}/check-out`, bookingSchema, { method: 'POST' });
export const cancelBooking = (id: string) => mutate(`/v1/bookings/${id}/cancel`, bookingSchema, { method: 'POST' });

export const fetchProperties = () => request('/v1/properties', z.array(propertySchema));
export const fetchOpsItems = (domain: string, status?: string) => request(`/v1/${domain}${status ? `?status=${status}` : ''}`, z.array(opsItemSchema));
export const fetchOpsStats = (domain: string) => request(`/v1/${domain}/stats`, opsStatsSchema);
export const createOpsItem = (domain: string, payload: { title: string; priority: 'low' | 'medium' | 'high' }) => request(`/v1/${domain}`, opsItemSchema, { method: 'POST', body: JSON.stringify(payload) });
export const updateOpsItem = (domain: string, id: string, payload: Partial<Pick<OpsItemDto, 'status' | 'priority' | 'notes'>>) => request(`/v1/${domain}/${id}`, opsItemSchema, { method: 'PATCH', body: JSON.stringify(payload) });
export const completeOpsItem = (domain: string, id: string) => request(`/v1/${domain}/${id}/complete`, opsItemSchema, { method: 'POST' });
