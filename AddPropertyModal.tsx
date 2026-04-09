'use client';

import { useState } from 'react';
import { db } from '@/firebase';
import { collection, addDoc, setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { X, Loader2, Home, MapPin, Users, BedDouble } from 'lucide-react';
import { useAuth } from '@/components/Navbar';

interface AddPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddPropertyModal({ isOpen, onClose }: AddPropertyModalProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    country: '',
    bedrooms: 1,
    max_guests: 2,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      // 1. Create Property
      const propertyRef = await addDoc(collection(db, 'properties'), {
        name: formData.name,
        city: formData.city,
        country: formData.country,
        bedrooms: Number(formData.bedrooms),
        max_guests: Number(formData.max_guests),
        owner_name: user.displayName || 'Superhost',
        amenities: ['WiFi', 'Essentials'], // Default amenities
        created_at: serverTimestamp()
      });

      // 2. Create Initial Metrics
      await addDoc(collection(db, 'metrics'), {
        property_id: propertyRef.id,
        revenue: 0,
        occupancy: 0,
        adr: 0,
        revpar: 0,
        inventory_health: 100,
        audit_score: 5,
        cleaning_score: 100,
        linen_score: 100,
        maintenance_score: 100,
        stock_days: 30,
        lead_time: 0,
        restock_flag: false,
        cleaning_flag: false,
        maintenance_flag: false,
        updated_at: serverTimestamp(),
      });

      // 3. Create Initial Prediction
      await setDoc(doc(db, 'predictions', propertyRef.id), {
        property_id: propertyRef.id,
        stay_readiness: 100,
        risk_level: 'LOW',
        updated_at: serverTimestamp(),
      });

      onClose();
      setFormData({ name: '', city: '', country: '', bedrooms: 1, max_guests: 2 });
    } catch (error) {
      console.error('Error adding property:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 bottom-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 bg-white rounded-3xl shadow-2xl z-50 w-auto md:w-full max-w-md flex flex-col overflow-hidden border border-gray-200"
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-[#222222]">Add New Property</h2>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Property Name</label>
                <div className="relative">
                  <Home className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full rounded-xl bg-gray-50 border border-gray-200 py-3 pl-10 pr-4 text-sm font-medium text-[#222222] focus:border-[#FF385C] focus:ring-1 focus:ring-[#FF385C] outline-none transition-all"
                    placeholder="e.g. Seaside Villa"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">City</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      required
                      type="text"
                      value={formData.city}
                      onChange={e => setFormData(prev => ({ ...prev, city: e.target.value }))}
                      className="w-full rounded-xl bg-gray-50 border border-gray-200 py-3 pl-10 pr-4 text-sm font-medium text-[#222222] focus:border-[#FF385C] focus:ring-1 focus:ring-[#FF385C] outline-none transition-all"
                      placeholder="e.g. Malibu"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Country</label>
                  <input
                    required
                    type="text"
                    value={formData.country}
                    onChange={e => setFormData(prev => ({ ...prev, country: e.target.value }))}
                    className="w-full rounded-xl bg-gray-50 border border-gray-200 p-3 text-sm font-medium text-[#222222] focus:border-[#FF385C] focus:ring-1 focus:ring-[#FF385C] outline-none transition-all"
                    placeholder="e.g. USA"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Bedrooms</label>
                  <div className="relative">
                    <BedDouble className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      required
                      type="number"
                      min="1"
                      value={formData.bedrooms}
                      onChange={e => setFormData(prev => ({ ...prev, bedrooms: parseInt(e.target.value) || 1 }))}
                      className="w-full rounded-xl bg-gray-50 border border-gray-200 py-3 pl-10 pr-4 text-sm font-medium text-[#222222] focus:border-[#FF385C] focus:ring-1 focus:ring-[#FF385C] outline-none transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Max Guests</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      required
                      type="number"
                      min="1"
                      value={formData.max_guests}
                      onChange={e => setFormData(prev => ({ ...prev, max_guests: parseInt(e.target.value) || 1 }))}
                      className="w-full rounded-xl bg-gray-50 border border-gray-200 py-3 pl-10 pr-4 text-sm font-medium text-[#222222] focus:border-[#FF385C] focus:ring-1 focus:ring-[#FF385C] outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-2 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#FF385C] px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#E31C5F] active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                  {isSubmitting ? 'Adding Property...' : 'Add Property'}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
