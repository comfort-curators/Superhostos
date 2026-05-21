import type { Booking, Property } from './types';

export const propertyTypes = ['Villa', 'Penthouse', 'Estate', 'Chalet'] as const;

export const initialProperties: Property[] = [
  {
    id: 1,
    name: 'Villa Azure',
    location: 'Santorini, Greece',
    pricePerNight: 1250,
    bedrooms: 5,
    type: 'Villa',
    image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
    rating: 4.98,
    occupancy: 92,
  },
  {
    id: 2,
    name: 'The Penthouse',
    location: 'Dubai Marina',
    pricePerNight: 890,
    bedrooms: 3,
    type: 'Penthouse',
    image: 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80',
    rating: 4.95,
    occupancy: 87,
  },
  {
    id: 3,
    name: 'Cliffside Estate',
    location: 'Big Sur, CA',
    pricePerNight: 2100,
    bedrooms: 6,
    type: 'Estate',
    image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
    rating: 4.99,
    occupancy: 95,
  },
  {
    id: 4,
    name: 'Alpine Chalet',
    location: 'Zermatt, Switzerland',
    pricePerNight: 1450,
    bedrooms: 4,
    type: 'Chalet',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
    rating: 4.92,
    occupancy: 78,
  },
  {
    id: 5,
    name: 'Oceanfront Villa',
    location: 'Bali, Indonesia',
    pricePerNight: 680,
    bedrooms: 4,
    type: 'Villa',
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
    rating: 4.87,
    occupancy: 84,
  },
  {
    id: 6,
    name: 'Sky Residence',
    location: 'NYC, USA',
    pricePerNight: 3200,
    bedrooms: 5,
    type: 'Penthouse',
    image: 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80',
    rating: 4.96,
    occupancy: 91,
  },
];

export const initialBookings: Booking[] = [
  {
    id: 101,
    guest: 'Elena V.',
    property: 'Villa Azure',
    dates: 'Jun 12-19',
    amount: 8750,
    status: 'confirmed',
  },
  {
    id: 102,
    guest: 'Marcus T.',
    property: 'Cliffside Estate',
    dates: 'Jun 15-22',
    amount: 14700,
    status: 'confirmed',
  },
  {
    id: 103,
    guest: 'Sofia K.',
    property: 'The Penthouse',
    dates: 'Jun 20-25',
    amount: 4450,
    status: 'pending',
  },
  {
    id: 104,
    guest: 'Liam R.',
    property: 'Alpine Chalet',
    dates: 'Jul 1-8',
    amount: 10150,
    status: 'confirmed',
  },
  {
    id: 105,
    guest: 'Aisha P.',
    property: 'Oceanfront Villa',
    dates: 'Jul 3-10',
    amount: 4760,
    status: 'cancelled',
  },
];

export const revenueData = [
  { month: 'Jan', revenue: 124000, bookings: 42 },
  { month: 'Feb', revenue: 98000, bookings: 31 },
  { month: 'Mar', revenue: 156000, bookings: 58 },
  { month: 'Apr', revenue: 189000, bookings: 67 },
  { month: 'May', revenue: 214000, bookings: 72 },
  { month: 'Jun', revenue: 267000, bookings: 89 },
];

export const pieData = [
  { name: 'Villa', value: 38, fill: '#c5a26f' },
  { name: 'Penthouse', value: 25, fill: '#8b7355' },
  { name: 'Estate', value: 22, fill: '#a67c52' },
  { name: 'Chalet', value: 15, fill: '#d4af37' },
];

export const barData = [
  { name: 'Occupancy', value: 89 },
  { name: 'Avg Rating', value: 94 },
  { name: 'Response', value: 97 },
  { name: 'Superhost', value: 100 },
];
