import { PropertyCard } from './components/PropertyCard';

function App() {
  return (
    <div className="min-h-screen bg-[#F0EAE2] p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <h1 className="text-4xl font-semibold tracking-tight text-[#1A1914]">
            SuperhostOS
          </h1>
          <p className="mt-2 text-[#8B7B6B]">Your properties at a glance</p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <PropertyCard
            id="PROP001"
            name="Azure Bay Villa"
            city="Malibu, California"
            bedrooms={4}
            occupancy={92}
            revenue={18400}
            readinessScore={96}
            status="good"
          />

          <PropertyCard
            id="PROP002"
            name="Alpine Chalet"
            city="Aspen, Colorado"
            bedrooms={6}
            occupancy={78}
            revenue={22100}
            readinessScore={84}
            status="warning"
          />

          <PropertyCard
            id="PROP003"
            name="Desert Oasis"
            city="Scottsdale, Arizona"
            bedrooms={3}
            occupancy={65}
            revenue={9800}
            readinessScore={71}
            status="warning"
          />
        </div>
      </div>
    </div>
  );
}

export default App;
