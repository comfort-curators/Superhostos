-- SuperhostOS — initial schema (properties, bookings)

DO $$ BEGIN
  CREATE TYPE booking_status AS ENUM ('confirmed', 'checked_in', 'checked_out', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE booking_source AS ENUM ('direct', 'airbnb', 'booking_com', 'vrbo');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE inventory_category AS ENUM ('amenities', 'linen', 'consumables', 'cleaning', 'minibar');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  city text NOT NULL,
  timezone text NOT NULL,
  is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL,
  property_name text NOT NULL,
  source booking_source NOT NULL,
  external_reservation_id text NOT NULL,
  guest_name text NOT NULL,
  guest_count integer NOT NULL,
  check_in date NOT NULL,
  check_out date NOT NULL,
  status booking_status NOT NULL DEFAULT 'confirmed',
  total_amount double precision NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bookings_property ON bookings (property_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings (status);

CREATE TABLE IF NOT EXISTS inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL,
  sku text NOT NULL,
  name text NOT NULL,
  category inventory_category NOT NULL,
  unit text NOT NULL,
  on_hand double precision NOT NULL,
  par_level double precision NOT NULL,
  base_daily_usage double precision NOT NULL
);

CREATE TABLE IF NOT EXISTS vendor_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  skus text[] NOT NULL,
  unit_price double precision NOT NULL,
  lead_time_days double precision NOT NULL,
  reliability double precision NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_inventory_items_property ON inventory_items (property_id);

-- Seed the foundational demo data referenced by the calendar, inventory budgets,
-- and occupancy snapshot. Idempotent, so it is safe to re-run.
INSERT INTO properties (id, name, city, timezone, is_active) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Nobu Penthouse', 'Los Angeles', 'America/Los_Angeles', true),
  ('00000000-0000-0000-0000-000000000002', 'Palm Loft', 'Miami', 'America/New_York', true),
  ('00000000-0000-0000-0000-000000000003', 'Cedar Cabin', 'Aspen', 'America/Denver', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO inventory_items (id, property_id, sku, name, category, unit, on_hand, par_level, base_daily_usage) VALUES
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'TWL-BATH', 'Bath Towels', 'linen', 'each', 24, 40, 1.5),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'COF-POD', 'Coffee Pods', 'minibar', 'pod', 60, 80, 4),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'SOAP-BAR', 'Soap Bars', 'amenities', 'each', 120, 60, 2),
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000002', 'TWL-BATH', 'Bath Towels', 'linen', 'each', 10, 36, 1.8),
  ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000002', 'TP-ROLL', 'Toilet Paper', 'consumables', 'roll', 30, 50, 2.5),
  ('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000003', 'CLN-MULTI', 'Multi-surface Cleaner', 'cleaning', 'bottle', 8, 12, 0.4)
ON CONFLICT (id) DO NOTHING;

INSERT INTO vendor_options (id, name, skus, unit_price, lead_time_days, reliability) VALUES
  ('20000000-0000-0000-0000-000000000001', 'BulkSupply Co', ARRAY['TWL-BATH','TP-ROLL','SOAP-BAR'], 4.2, 4, 0.82),
  ('20000000-0000-0000-0000-000000000002', 'RapidRestock', ARRAY['TWL-BATH','COF-POD','TP-ROLL'], 5.6, 1, 0.91),
  ('20000000-0000-0000-0000-000000000003', 'ValueHospitality', ARRAY['SOAP-BAR','COF-POD','CLN-MULTI'], 3.1, 7, 0.74),
  ('20000000-0000-0000-0000-000000000004', 'PrimeAmenities', ARRAY['TWL-BATH','SOAP-BAR','COF-POD','CLN-MULTI'], 4.8, 3, 0.88)
ON CONFLICT (id) DO NOTHING;
