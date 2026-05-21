import { z } from 'zod';

export const propertySchema = z.object({
  name: z.string().min(3, 'Name too short'),
  location: z.string().min(3, 'Location required'),
  pricePerNight: z.number().min(50, 'Min $50/night'),
  bedrooms: z.number().min(1).max(10),
  type: z.enum(['Villa', 'Penthouse', 'Estate', 'Chalet']),
});

export type Property = z.infer<typeof propertySchema> & {
  id: number;
  image: string;
  rating: number;
  occupancy: number;
};

export type BookingStatus = 'confirmed' | 'pending' | 'cancelled';

export type Booking = {
  id: number;
  guest: string;
  property: string;
  dates: string;
  amount: number;
  status: BookingStatus;
};

export type DashboardTab = 'dashboard' | 'properties' | 'bookings' | 'analytics' | 'settings';
