'use client';

import { useState } from 'react';
import { db } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, X, Check, Loader2, Edit2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AmenitiesManagerProps {
  propertyId: string;
  amenities: string[];
}

const COMMON_AMENITIES = [
  'WiFi', 'Pool', 'Free Parking', 'Kitchen', 'Hot Tub', 
  'Air Conditioning', 'Heating', 'Washer', 'Dryer', 
  'TV', 'Gym', 'Fireplace', 'Ski-in/Ski-out', 'Elevator',
  'BBQ Grill', 'Patio or Balcony', 'Beach Access'
];

export function AmenitiesManager({ propertyId, amenities = [] }: AmenitiesManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentAmenities, setCurrentAmenities] = useState<string[]>(amenities || []);
  const [customAmenity, setCustomAmenity] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const toggleAmenity = (amenity: string) => {
    setCurrentAmenities(prev => 
      prev.includes(amenity) 
        ? prev.filter(a => a !== amenity)
        : [...prev, amenity]
    );
  };

  const addCustomAmenity = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customAmenity.trim();
    if (trimmed && !currentAmenities.includes(trimmed)) {
      setCurrentAmenities(prev => [...prev, trimmed]);
    }
    setCustomAmenity('');
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'properties', propertyId), {
        amenities: currentAmenities
      });
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to update amenities:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setCurrentAmenities(amenities || []);
    setIsOpen(false);
  };

  return (
    <div className="mt-6 border-t border-gray-100 pt-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5" />
          Amenities
        </h4>
        <button 
          onClick={() => setIsOpen(true)}
          className="text-xs font-semibold text-[#FF385C] hover:text-[#E31C5F] flex items-center gap-1 p-1"
        >
          <Edit2 className="h-3 w-3" />
          Edit
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {amenities && amenities.length > 0 ? (
          amenities.slice(0, 4).map(amenity => (
            <span key={amenity} className="px-2.5 py-1 bg-gray-50 border border-gray-200 text-[#717171] text-xs font-medium rounded-full">
              {amenity}
            </span>
          ))
        ) : (
          <span className="text-xs text-gray-400 italic">No amenities listed</span>
        )}
        {amenities && amenities.length > 4 && (
          <span className="px-2.5 py-1 bg-gray-50 border border-gray-200 text-[#717171] text-xs font-medium rounded-full">
            +{amenities.length - 4} more
          </span>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCancel}
              className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-x-4 bottom-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 bg-white rounded-3xl shadow-2xl z-50 w-auto md:w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden border border-gray-200"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-[#222222]">Manage Amenities</h2>
                <button 
                  onClick={handleCancel}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                <div className="mb-6">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Common Amenities</label>
                  <div className="flex flex-wrap gap-2">
                    {COMMON_AMENITIES.map(amenity => {
                      const isSelected = currentAmenities.includes(amenity);
                      return (
                        <button
                          key={amenity}
                          onClick={() => toggleAmenity(amenity)}
                          className={cn(
                            "px-4 py-2 rounded-full text-sm font-medium transition-all border",
                            isSelected 
                              ? "bg-[#FF385C] text-white border-[#FF385C] shadow-sm" 
                              : "bg-white text-[#717171] border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                          )}
                        >
                          {isSelected && <Check className="h-3.5 w-3.5 inline-block mr-1.5 -ml-1" />}
                          {amenity}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Add Custom Amenity</label>
                  <form onSubmit={addCustomAmenity} className="flex gap-2">
                    <input
                      type="text"
                      value={customAmenity}
                      onChange={(e) => setCustomAmenity(e.target.value)}
                      placeholder="e.g. EV Charger"
                      className="flex-1 rounded-xl bg-gray-50 border border-gray-200 p-3 text-sm font-medium text-[#222222] focus:border-[#FF385C] focus:ring-1 focus:ring-[#FF385C] outline-none transition-all"
                    />
                    <button 
                      type="submit"
                      disabled={!customAmenity.trim()}
                      className="px-4 py-2 bg-gray-900 text-white rounded-xl font-semibold text-sm hover:bg-black disabled:opacity-50 transition-colors flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add
                    </button>
                  </form>
                </div>
                
                {currentAmenities.filter(a => !COMMON_AMENITIES.includes(a)).length > 0 && (
                  <div className="mt-6">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Custom Amenities</label>
                    <div className="flex flex-wrap gap-2">
                      {currentAmenities.filter(a => !COMMON_AMENITIES.includes(a)).map(amenity => (
                        <button
                          key={amenity}
                          onClick={() => toggleAmenity(amenity)}
                          className="px-4 py-2 rounded-full text-sm font-medium transition-all border bg-[#FF385C] text-white border-[#FF385C] shadow-sm"
                        >
                          <Check className="h-3.5 w-3.5 inline-block mr-1.5 -ml-1" />
                          {amenity}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                <button
                  onClick={handleCancel}
                  className="px-6 py-3 rounded-xl font-semibold text-[#222222] hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#FF385C] font-semibold text-white hover:bg-[#E31C5F] transition-colors disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
