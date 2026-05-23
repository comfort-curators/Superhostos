import { Badge } from '../components/Badge';

export default function MasterCalendar() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-[#1A1914]">Master Calendar</h1>
        <p className="text-[#8B7B6B] mt-1">Unified view across all properties (iCal synced)</p>
      </div>

      <div className="bg-white border border-[#E8E0D8] rounded-2xl p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            <Badge variant="accent">This Month</Badge>
            <Badge>Airbnb</Badge>
            <Badge>VRBO</Badge>
          </div>
          <button className="text-sm text-[#8C6D3F] hover:underline">Sync iCal URLs</button>
        </div>

        <div className="text-center py-12 text-[#8B7B6B]">
          Calendar grid coming soon.
        </div>
      </div>
    </div>
  );
}
