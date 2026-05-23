import { create } from 'zustand';

import type { Property, Booking } from '../types';

interface SuperhostState {
  properties: Property[];
  bookings: Booking[];
  activePropertyId: string | null;
  cart: any[];

  // Actions
  setProperties: (properties: Property[]) => void;
  setBookings: (bookings: Booking[]) => void;
  setActiveProperty: (id: string | null) => void;
  addToCart: (item: any) => void;
  clearCart: () => void;
}

export const useSuperhostStore = create<SuperhostState>((set) => ({
  properties: [],
  bookings: [],
  activePropertyId: null,
  cart: [],

  setProperties: (properties) => set({ properties }),
  setBookings: (bookings) => set({ bookings }),
  setActiveProperty: (id) => set({ activePropertyId: id }),
  addToCart: (item) => set((state) => ({ cart: [...state.cart, item] })),
  clearCart: () => set({ cart: [] }),
}));
