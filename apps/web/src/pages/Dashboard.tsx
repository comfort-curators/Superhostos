import { useSuperhostStore } from '../store/useSuperhostStore';
import { PropertyCard } from '../components/PropertyCard';
import { Button } from '../components/Button';

export default function Dashboard() {
  const { properties, setProperties } = useSuperhostStore();

  // Temporary mock data until real data fetching is wired
  const mockProperties = [
    { id: 'p1', name: 'Azure Bay Villa', city: 'Malibu', bedrooms: 4, maxGuests: 8, amenities: ['Pool', 'Ocean View'] },
    { id: 'p2', name: 'Serenity Loft', city: 'Aspen', bedrooms: 3, maxGuests: 6, amenities: ['Hot Tub', 'Fireplace'] },
  ];

  if (properties.length === 0) {
    setProperties(mockProperties as any);
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#1A1914]">Dashboard</h1>
          <p className="text-[#8B7B6B] mt-1">Overview of your portfolio</p>
        </div>
        <Button onClick={() => console.log('Add property clicked')}>Add Property</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map((property) => (
          <PropertyCard
            key={property.id}
            property={property as any}
            onClick={() => console.log('Open property', property.id)}
          />
        ))}
      </div>
    </div>
  );
}
