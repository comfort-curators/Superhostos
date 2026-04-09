'use client';

import { useState, useEffect } from 'react';
import { db } from '@/firebase';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/components/Navbar';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingCart, Plus, Minus, X, CheckCircle2, Loader2, 
  ShieldCheck, Wifi, BedDouble, Bath, Utensils, Coffee, 
  Monitor, Baby, Dog, Sparkles, Package, Gift
} from 'lucide-react';

const INVENTORY_CATEGORIES = [
  {
    id: 'access-safety',
    name: 'Access & Safety',
    icon: ShieldCheck,
    items: [
      { id: 'as1', name: 'Smart lock (keypad)', price: 149.99 },
      { id: 'as2', name: 'Backup lockbox + key', price: 29.99 },
      { id: 'as3', name: 'Smoke detectors', price: 39.99 },
      { id: 'as4', name: 'Carbon monoxide detectors', price: 45.00 },
      { id: 'as5', name: 'Fire extinguisher', price: 34.50 },
      { id: 'as6', name: 'Fire blanket', price: 19.99 },
      { id: 'as7', name: 'First aid kit', price: 24.99 },
    ]
  },
  {
    id: 'tech-monitoring',
    name: 'Tech & Monitoring',
    icon: Wifi,
    items: [
      { id: 'tm1', name: 'Noise monitor', price: 99.00 },
      { id: 'tm2', name: 'WiFi router / Mesh system', price: 199.99 },
    ]
  },
  {
    id: 'bedroom',
    name: 'Bedroom',
    icon: BedDouble,
    items: [
      { id: 'bd1', name: 'Mattress protectors (zippered)', price: 45.00 },
      { id: 'bd2', name: 'Mattress topper', price: 89.99 },
      { id: 'bd3', name: 'Bedsheets (3 sets per bed)', price: 120.00 },
      { id: 'bd4', name: 'Pillow sets (firm + soft)', price: 60.00 },
      { id: 'bd5', name: 'Extra pillows (memory foam/down alt)', price: 40.00 },
    ]
  },
  {
    id: 'bathroom',
    name: 'Bathroom',
    icon: Bath,
    items: [
      { id: 'ba1', name: 'Bath towels (2 per guest)', price: 35.00 },
      { id: 'ba2', name: 'Hand towels', price: 15.00 },
      { id: 'ba3', name: 'Washcloths', price: 10.00 },
      { id: 'ba4', name: 'Makeup towels', price: 12.00 },
      { id: 'ba5', name: 'Bath mat (non-slip)', price: 22.00 },
      { id: 'ba6', name: 'Shampoo / Conditioner / Body wash (bulk)', price: 45.00 },
      { id: 'ba7', name: 'Toiletry kits (toothbrush, razor, etc.)', price: 8.50 },
    ]
  },
  {
    id: 'kitchen',
    name: 'Kitchen',
    icon: Utensils,
    items: [
      { id: 'ki1', name: 'Cookware set (pots + pans)', price: 150.00 },
      { id: 'ki2', name: 'Non-stick pan (1–2)', price: 40.00 },
      { id: 'ki3', name: 'Stockpot', price: 35.00 },
      { id: 'ki4', name: 'Saucepans (2 sizes)', price: 45.00 },
      { id: 'ki5', name: 'Dutch oven', price: 65.00 },
      { id: 'ki6', name: 'Knife set', price: 85.00 },
      { id: 'ki7', name: 'Cutting boards', price: 25.00 },
      { id: 'ki8', name: 'Can opener & Corkscrew', price: 18.00 },
      { id: 'ki9', name: 'Meat thermometer', price: 15.00 },
      { id: 'ki10', name: 'Plates & Bowls (2× occupancy)', price: 60.00 },
      { id: 'ki11', name: 'Glasses & Cutlery', price: 50.00 },
    ]
  },
  {
    id: 'appliances-pantry',
    name: 'Appliances & Pantry',
    icon: Coffee,
    items: [
      { id: 'ap1', name: 'Coffee machine (pod + drip)', price: 120.00 },
      { id: 'ap2', name: 'French press', price: 25.00 },
      { id: 'ap3', name: 'Salt, pepper, Cooking oil', price: 15.00 },
      { id: 'ap4', name: 'Basic spices', price: 20.00 },
      { id: 'ap5', name: 'Sugar / coffee', price: 18.00 },
    ]
  },
  {
    id: 'living-work',
    name: 'Living / Work',
    icon: Monitor,
    items: [
      { id: 'lw1', name: 'Desk', price: 150.00 },
      { id: 'lw2', name: 'Ergonomic chair', price: 199.00 },
      { id: 'lw3', name: 'Laptop dock', price: 85.00 },
      { id: 'lw4', name: 'External monitor', price: 250.00 },
      { id: 'lw5', name: 'Power strips / adapters', price: 30.00 },
    ]
  },
  {
    id: 'family-pets',
    name: 'Family & Pets',
    icon: Baby,
    items: [
      { id: 'fp1', name: 'Pack ’n Play', price: 75.00 },
      { id: 'fp2', name: 'High chair', price: 45.00 },
      { id: 'fp3', name: 'Baby gate', price: 35.00 },
      { id: 'fp4', name: 'Kids utensils', price: 12.00 },
      { id: 'fp5', name: 'Dog bed', price: 40.00 },
      { id: 'fp6', name: 'Couch covers', price: 55.00 },
      { id: 'fp7', name: 'Enzyme cleaner', price: 15.00 },
    ]
  },
  {
    id: 'cleaning-ops',
    name: 'Cleaning & Ops',
    icon: Sparkles,
    items: [
      { id: 'co1', name: 'Vacuum', price: 150.00 },
      { id: 'co2', name: 'Mop / steam mop', price: 65.00 },
      { id: 'co3', name: 'Microfiber cloths', price: 18.00 },
      { id: 'co4', name: 'Cleaning supplies', price: 45.00 },
      { id: 'co5', name: 'Trash bags', price: 20.00 },
    ]
  },
  {
    id: 'owner-closet',
    name: 'Owner Closet',
    icon: Package,
    items: [
      { id: 'oc1', name: 'Extra linens (par 3)', price: 150.00 },
      { id: 'oc2', name: 'Batteries', price: 15.00 },
      { id: 'oc3', name: 'Light bulbs', price: 25.00 },
      { id: 'oc4', name: 'HVAC filters', price: 35.00 },
    ]
  },
  {
    id: 'welcome-kit',
    name: 'Welcome Kit',
    icon: Gift,
    items: [
      { id: 'wk1', name: 'Bottled water', price: 10.00 },
      { id: 'wk2', name: 'Snacks', price: 25.00 },
      { id: 'wk3', name: 'Local items (coffee/jam)', price: 35.00 },
      { id: 'wk4', name: 'Printed guide / QR', price: 15.00 },
    ]
  }
];

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export default function ShopPage() {
  const { user, loading: authLoading } = useAuth();
  const [activeCategory, setActiveCategory] = useState(INVENTORY_CATEGORIES[0].id);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  const [properties, setProperties] = useState<any[]>([]);
  const [selectedProperty, setSelectedProperty] = useState('');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      const fetchProperties = async () => {
        const snapshot = await getDocs(collection(db, 'properties'));
        setProperties(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      };
      fetchProperties();
    }
  }, [user]);

  const addToCart = (item: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQuantity = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = async () => {
    if (!selectedProperty || cart.length === 0) return;
    setIsCheckingOut(true);

    try {
      // Create an order for each item in the cart to match the Vendor portal structure
      for (const item of cart) {
        await addDoc(collection(db, 'orders'), {
          property_id: selectedProperty,
          item: item.name,
          quantity: item.quantity,
          status: 'pending',
          created_at: serverTimestamp(),
          total_price: item.price * item.quantity
        });
      }

      setCart([]);
      setCheckoutSuccess(true);
      setTimeout(() => {
        setCheckoutSuccess(false);
        setIsCartOpen(false);
      }, 3000);
    } catch (error) {
      console.error("Checkout failed", error);
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF385C]" />
      </div>
    );
  }

  if (!user) {
    return <div className="text-center py-20 text-gray-500">Please sign in to access the inventory shop.</div>;
  }

  return (
    <div className="relative min-h-[80vh] pb-24">
      <div className="flex items-center justify-between border-b border-gray-200 pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#222222] tracking-tight">Inventory Shop</h1>
          <p className="text-[#717171] mt-1 font-medium">Order supplies and essentials for your properties.</p>
        </div>
        <button 
          onClick={() => setIsCartOpen(true)}
          className="relative flex items-center gap-2 rounded-xl bg-white border border-gray-200 px-6 py-3 text-sm font-semibold text-[#222222] hover:bg-gray-50 transition-colors shadow-sm"
        >
          <ShoppingCart className="h-5 w-5" />
          Cart
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#FF385C] text-xs font-bold text-white">
              {cartCount}
            </span>
          )}
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Categories */}
        <div className="w-full md:w-64 shrink-0">
          <div className="sticky top-24 space-y-1">
            {INVENTORY_CATEGORIES.map(category => {
              const Icon = category.icon;
              const isActive = activeCategory === category.id;
              return (
                <button
                  key={category.id}
                  onClick={() => {
                    setActiveCategory(category.id);
                    document.getElementById(category.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                    isActive 
                      ? 'bg-red-50 text-[#FF385C]' 
                      : 'text-[#717171] hover:bg-gray-50 hover:text-[#222222]'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {category.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 space-y-12">
          {INVENTORY_CATEGORIES.map(category => (
            <div key={category.id} id={category.id} className="scroll-mt-24">
              <h2 className="text-xl font-bold text-[#222222] mb-6 flex items-center gap-2">
                <category.icon className="h-6 w-6 text-[#FF385C]" />
                {category.name}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {category.items.map(item => (
                  <div key={item.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                    <div>
                      <h3 className="font-semibold text-[#222222] leading-tight">{item.name}</h3>
                      <p className="text-[#717171] mt-2 font-medium">${item.price.toFixed(2)}</p>
                    </div>
                    <button
                      onClick={() => addToCart(item)}
                      className="mt-6 w-full flex items-center justify-center gap-2 rounded-lg bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm font-semibold text-[#222222] hover:bg-gray-100 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      Add to Cart
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cart Slide-over */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col border-l border-gray-200"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-[#222222]">Your Cart</h2>
                <button 
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {cart.length === 0 ? (
                  <div className="text-center py-20">
                    <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">Your cart is empty</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.id} className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-semibold text-[#222222] text-sm">{item.name}</h4>
                        <p className="text-[#717171] text-sm">${(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-1 border border-gray-200">
                        <button 
                          onClick={() => updateQuantity(item.id, -1)}
                          className="p-1.5 rounded-md hover:bg-white hover:shadow-sm transition-all text-gray-600"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-sm font-semibold w-4 text-center">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, 1)}
                          className="p-1.5 rounded-md hover:bg-white hover:shadow-sm transition-all text-gray-600"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-6 border-t border-gray-100 bg-gray-50">
                  <div className="flex items-center justify-between mb-6">
                    <span className="font-semibold text-[#717171]">Total</span>
                    <span className="text-2xl font-bold text-[#222222]">${cartTotal.toFixed(2)}</span>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Deliver To Property</label>
                      <select
                        value={selectedProperty}
                        onChange={(e) => setSelectedProperty(e.target.value)}
                        className="w-full rounded-xl bg-white border border-gray-200 p-3 text-sm font-medium text-[#222222] focus:border-[#FF385C] focus:ring-1 focus:ring-[#FF385C] outline-none transition-all shadow-sm"
                      >
                        <option value="">Select a property...</option>
                        {properties.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>

                    {checkoutSuccess ? (
                      <div className="flex items-center justify-center gap-2 w-full rounded-xl bg-green-50 text-green-700 py-4 font-semibold border border-green-200">
                        <CheckCircle2 className="h-5 w-5" />
                        Order Placed Successfully!
                      </div>
                    ) : (
                      <button
                        onClick={handleCheckout}
                        disabled={!selectedProperty || isCheckingOut}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#FF385C] px-6 py-4 text-base font-semibold text-white transition-colors hover:bg-[#E31C5F] active:scale-95 disabled:opacity-50 disabled:hover:bg-[#FF385C]"
                      >
                        {isCheckingOut ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShoppingCart className="h-5 w-5" />}
                        {isCheckingOut ? 'Processing...' : 'Checkout'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
