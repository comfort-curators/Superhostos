import { useSuperhostStore } from '../store/useSuperhostStore';
import { PropertyCard } from '../components/PropertyCard';
import { Button } from '../components/Button';
import { Input } from '../components/Input';

export default function Properties() {
  const { properties } = useSuperhostStore();
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div><h1 className="text-3xl font-semibold tracking-tight">Properties</h1></div>
        <Button>Add New Property</Button>
      </div>
      <div className="mb-6 max-w-sm"><Input placeholder="Search properties..." /></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.length > 0 ? properties.map((p: any) => (
          <PropertyCard key={p.id} id={p.id} name={p.name} city={p.city} bedrooms={p.bedrooms} occupancy={p.occupancy} revenue={p.revenue} readinessScore={p.readinessScore} status={p.status} />
        )) : <p className="text-[#8B7B6B]">No properties yet.</p>}
      </div>
    </div>
  );
}
