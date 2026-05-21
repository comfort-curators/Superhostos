import { initialProperties, initialBookings } from '../data';
import type { Booking, Property } from '../types';

const API_BASE = '/api/v1';

async function safeFetch<T>(path: string, fallback: T) {
  try {
    const response = await fetch(`${API_BASE}${path}`);
    if (!response.ok) {
      throw new Error('backend unavailable');
    }
    return (await response.json()) as T;
  } catch (error) {
    console.warn('Backend fetch failed, using fallback data', error);
    return fallback;
  }
}

export async function fetchProperties(): Promise<Property[]> {
  return safeFetch('/properties', initialProperties);
}

export async function fetchBookings(): Promise<Booking[]> {
  return safeFetch('/bookings', initialBookings);
}
