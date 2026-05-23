import { motion } from 'framer-motion';

interface PropertyCardProps {
  id: string;
  name: string;
  city: string;
  bedrooms: number;
  occupancy?: number;
  revenue?: number;
  readinessScore?: number;
  status?: 'good' | 'warning' | 'critical';
}

export function PropertyCard({
  name,
  city,
  bedrooms,
  occupancy = 87,
  revenue = 12400,
  readinessScore = 92,
  status = 'good',
}: PropertyCardProps) {
  const statusColors = {
    good: 'bg-emerald-500',
    warning: 'bg-amber-500',
    critical: 'bg-red-500',
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="group relative overflow-hidden rounded-3xl border border-[#E8E0D8] bg-white p-6 shadow-sm transition-all hover:shadow-md"
    >
      {/* Top accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#8C6D3F] to-[#D4B896]" />

      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xl font-semibold tracking-tight text-[#1A1914]">{name}</h3>
          <p className="mt-1 text-sm text-[#8B7B6B]">{city}</p>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-2">
          <div className={`h-2.5 w-2.5 rounded-full ${statusColors[status]}`} />
          <span className="text-xs font-medium uppercase tracking-[1px] text-[#8B7B6B]">
            {status}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="mt-8 grid grid-cols-3 gap-4">
        <div>
          <div className="text-xs uppercase tracking-[1px] text-[#8B7B6B]">Bedrooms</div>
          <div className="mt-1 text-3xl font-semibold text-[#1A1914]">{bedrooms}</div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-[1px] text-[#8B7B6B]">Occupancy</div>
          <div className="mt-1 text-3xl font-semibold text-[#1A1914]">{occupancy}<span className="text-lg align-super">%</span></div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-[1px] text-[#8B7B6B]">Revenue</div>
          <div className="mt-1 text-3xl font-semibold text-[#1A1914]">
            ${(revenue / 1000).toFixed(1)}k
          </div>
        </div>
      </div>

      {/* Readiness Score */}
      <div className="mt-8">
        <div className="flex items-center justify-between text-xs uppercase tracking-[1px] text-[#8B7B6B]">
          <span>Stay Readiness</span>
          <span className="font-medium text-[#1A1914]">{readinessScore}%</span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#F0EAE2]">
          <div 
            className="h-full rounded-full bg-[#8C6D3F] transition-all" 
            style={{ width: `${readinessScore}%` }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 flex items-center justify-between border-t border-[#E8E0D8] pt-4">
        <button className="text-sm font-medium text-[#8C6D3F] hover:underline">
          View details →
        </button>
        <div className="text-xs text-[#8B7B6B]">
          Updated just now
        </div>
      </div>
    </motion.div>
  );
}
