import { useSuperhostStore } from '../store/useSuperhostStore';
import { PropertyCard } from '../components/PropertyCard';
import { Button } from '../components/Button';

export default function Dashboard() {
  const { properties, setProperties } = useSuperhostStore();

  if (properties.length === 0) {
    setProperties([
      { id: 'p1', name: 'Azure Bay Villa', city: 'Malibu', bedrooms: 4, occupancy: 92, revenue: 18400, readinessScore: 96, status: 'good' },
      { id: 'p2', name: 'Alpine Chalet', city: 'Aspen', bedrooms: 6, occupancy: 78, revenue: 22100, readinessScore: 85, status: 'warning' },
    ] as any);
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-[#8B7B6B]">Your properties at a glance</p>
        </div>
        <Button>Add Property</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map((p: any) => (
          <PropertyCard
            key={p.id}
            id={p.id}
            name={p.name}
            city={p.city}
            bedrooms={p.bedrooms}
            occupancy={p.occupancy}
            revenue={p.revenue}
            readinessScore={p.readinessScore}
            status={p.status}
          />
        ))}
      </div>
    </div>
  );
}
