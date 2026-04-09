'use client';

import { motion } from 'motion/react';
import { Shield, MapPin, TrendingUp, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AmenitiesManager } from './AmenitiesManager';
import Link from 'next/link';

interface PropertyCardProps {
  property: {
    id: string;
    name: string;
    city: string;
    amenities?: string[];
  };
  prediction: {
    stay_readiness: number;
    risk_level: string;
  };
  metrics: {
    occupancy: number;
    revenue: number;
    cleaning_flag?: boolean;
    restock_flag?: boolean;
  };
}

export function PropertyCard({ property, prediction, metrics }: PropertyCardProps) {
  const sr = Math.round(prediction.stay_readiness);
  const risk = prediction.risk_level;
  const occupancy = Math.round(metrics.occupancy * 100);
  const revenue = metrics.revenue.toLocaleString();

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'text-red-700 bg-red-100 border-red-200';
      case 'HIGH': return 'text-orange-700 bg-orange-100 border-orange-200';
      case 'STOCKOUT': return 'text-yellow-700 bg-yellow-100 border-yellow-200';
      default: return 'text-green-700 bg-green-100 border-green-200';
    }
  };

  const getProgressColor = (score: number) => {
    if (score < 60) return 'bg-[#FF385C]';
    if (score < 75) return 'bg-orange-500';
    return 'bg-green-500';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-all flex flex-col"
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold text-[#222222]">
            {property.name}
          </h3>
          <div className="mt-1 flex items-center gap-1 text-sm text-[#717171]">
            <MapPin className="h-4 w-4" />
            {property.city}
          </div>
        </div>
        <div className={cn("rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider", getRiskColor(risk))}>
          {risk}
        </div>
      </div>

      <div className="mt-8">
        <div className="flex items-end justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Stay Readiness</span>
          <span className="text-2xl font-bold text-[#222222]">{sr}<span className="text-base text-gray-400">%</span></span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${sr}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={cn("h-full rounded-full", getProgressColor(sr))}
          />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="rounded-xl bg-gray-50 p-4 border border-gray-100">
          <div className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-1">Housekeeping</div>
          <div className="flex items-center gap-2 text-base font-semibold text-[#222222]">
            {metrics.cleaning_flag ? (
              <><AlertTriangle className="h-4 w-4 text-orange-500" /> Needs Clean</>
            ) : (
              <><CheckCircle2 className="h-4 w-4 text-green-600" /> Clean</>
            )}
          </div>
        </div>
        <div className="rounded-xl bg-gray-50 p-4 border border-gray-100">
          <div className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-1">Inventory</div>
          <div className="flex items-center gap-2 text-base font-semibold text-[#222222]">
            {metrics.restock_flag || prediction.risk_level === 'STOCKOUT' ? (
              <><AlertTriangle className="h-4 w-4 text-red-500" /> Low Stock</>
            ) : (
              <><CheckCircle2 className="h-4 w-4 text-green-600" /> Stocked</>
            )}
          </div>
        </div>
      </div>

      <AmenitiesManager propertyId={property.id} amenities={property.amenities || []} />

      <div className="mt-6 pt-4 border-t border-gray-100 mt-auto">
        <Link 
          href={`/properties/${property.id}`} 
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-gray-50 px-4 py-3 text-sm font-semibold text-[#222222] hover:bg-gray-100 transition-colors border border-gray-200"
        >
          View Detailed Metrics
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </motion.div>
  );
}
