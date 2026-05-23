import { useSuperhostStore } from '../store/useSuperhostStore';
import { PropertyCard } from '../components/PropertyCard';
import { Button } from '../components/Button';
import { Input } from '../components/Input';

export default function Properties() {
  const { properties } = useSuperhostStore();

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#1A1914]">Properties</h1>
          <p className="text-[#8B7B6B] mt-1">Manage your portfolio</p>
        </div>
        <Button>Add New Property</Button>
      </div>

      <div className="mb-6 max-w-sm">
        <Input placeholder="Search properties..." />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.length > 0 ? (
          properties.map((property) => (
            <PropertyCard key={property.id} property={property as any} onClick={() => console.log('Open', property.id)} />
          ))
        ) : (
          <p className="text-[#8B7B6B]">No properties yet.</p>
        )}
      </div>
    </div>
  );
}
