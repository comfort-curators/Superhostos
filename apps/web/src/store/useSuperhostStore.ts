import { create } from 'zustand';

export interface Property {
  id: string;
  name: string;
  city: string;
  bedrooms: number;
  maxGuests: number;
  amenities?: string[];
}

export interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

interface SuperhostState {
  properties: Property[];
  cart: CartItem[];
  activePropertyId: string | null;

  setProperties: (properties: Property[]) => void;
  setActiveProperty: (id: string | null) => void;
  addToCart: (item: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (id: number) => void;
  clearCart: () => void;
  updateCartQuantity: (id: number, quantity: number) => void;
}

export const useSuperhostStore = create<SuperhostState>((set, get) => ({
  properties: [],
  cart: [],
  activePropertyId: null,

  setProperties: (properties) => set({ properties }),
  setActiveProperty: (id) => set({ activePropertyId: id }),

  addToCart: (item) => {
    const existing = get().cart.find((i) => i.id === item.id);
    if (existing) {
      set({
        cart: get().cart.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        ),
      });
    } else {
      set({ cart: [...get().cart, { ...item, quantity: 1 }] });
    }
  },

  removeFromCart: (id) => set({ cart: get().cart.filter((i) => i.id !== id) }),
  clearCart: () => set({ cart: [] }),
  updateCartQuantity: (id, quantity) =>
    set({
      cart: get().cart.map((i) => (i.id === id ? { ...i, quantity: Math.max(1, quantity) } : i)),
    }),
}));
