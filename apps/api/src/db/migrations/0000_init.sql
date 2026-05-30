-- SuperhostOS — initial schema (properties, bookings)

DO $$ BEGIN
  CREATE TYPE booking_status AS ENUM ('confirmed', 'checked_in', 'checked_out', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE booking_source AS ENUM ('direct', 'airbnb', 'booking_com', 'vrbo');
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

-- Seed the foundational demo properties referenced by inventory budgets and the
-- occupancy snapshot. Idempotent, so it is safe to re-run.
INSERT INTO properties (id, name, city, timezone, is_active) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Nobu Penthouse', 'Los Angeles', 'America/Los_Angeles', true),
  ('00000000-0000-0000-0000-000000000002', 'Palm Loft', 'Miami', 'America/New_York', true),
  ('00000000-0000-0000-0000-000000000003', 'Cedar Cabin', 'Aspen', 'America/Denver', true)
ON CONFLICT (id) DO NOTHING;
