// A lightweight, synchronous occupancy snapshot for the Inventory engine.
//
// The forecasting agents need a fast, synchronous occupancy signal; they must
// not depend on the (now async, DB-backed) bookings repository. This snapshot
// keeps the inventory pipeline self-contained and deterministic. In production
// it would be refreshed from a read model / the bookings service on a schedule.

export interface Stay {
  propertyId: string;
  status: 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';
  checkIn: string;
  checkOut: string;
}

export interface OccupancySource {
  staysFor(propertyId: string): Stay[];
}

const SEED: Stay[] = [
  { propertyId: '00000000-0000-0000-0000-000000000001', status: 'confirmed', checkIn: '2026-06-02', checkOut: '2026-06-06' },
  { propertyId: '00000000-0000-0000-0000-000000000002', status: 'checked_in', checkIn: '2026-05-28', checkOut: '2026-05-31' },
  { propertyId: '00000000-0000-0000-0000-000000000003', status: 'confirmed', checkIn: '2026-06-10', checkOut: '2026-06-14' }
];

export const defaultOccupancySource: OccupancySource = {
  staysFor: (propertyId) => SEED.filter((s) => s.propertyId === propertyId)
};
