import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { fetchBookingStats } from "../api/client";
import { useToast } from "../components/Toast";

const MetricTile = ({
  label,
  value,
  hint,
  href,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  href: string;
  accent?: string;
}) => (
  <Link
    href={href}
    className="group block rounded-2xl border border-line bg-card p-5 transition-colors hover:border-gold"
  >
    <div className="flex items-center justify-between">
      <p className="text-[11px] uppercase tracking-[0.14em] text-muted">
        {label}
      </p>
      <span
        className="h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: accent ?? "transparent" }}
      />
    </div>
    <p className="mt-1.5 font-display text-3xl text-ink">{value}</p>
    {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    <span className="mt-2 inline-block text-xs text-gold opacity-0 transition-opacity group-hover:opacity-100">
      View →
    </span>
  </Link>
);

const IntegrationCard = ({
  name,
  blurb,
  onConnect,
}: { name: string; blurb: string; onConnect: () => void }) => (
  <div className="flex items-center justify-between gap-3 rounded-2xl border border-dashed border-line bg-card p-4">
    <div>
      <p className="text-sm font-medium text-ink">
        {name} · <span className="text-muted">Not connected</span>
      </p>
      <p className="text-xs text-muted">{blurb}</p>
    </div>
    <button
      type="button"
      onClick={onConnect}
      className="shrink-0 rounded-xl bg-ink px-3 py-2 text-xs text-ivory transition-colors hover:bg-ink/90"
    >
      Connect
    </button>
  </div>
);

const QuickAction = ({ label, href }: { label: string; href: string }) => (
  <Link
    href={href}
    className="rounded-2xl border border-line bg-card px-4 py-3 text-sm text-ink transition-colors hover:bg-sand/50"
  >
    {label}
  </Link>
);

export const DashboardPage = () => {
  const toast = useToast();
  const { data: stats, isLoading } = useQuery({
    queryKey: ["bookings", "stats"],
    queryFn: fetchBookingStats,
  });
  const updated = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const num = (v?: number) => (isLoading ? "…" : String(v ?? 0));

  return (
    <section className="space-y-5 pb-20 md:pb-0">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="rounded-3xl border border-line bg-card p-7 shadow-[0_1px_2px_rgba(27,25,22,0.04)]"
      >
        <h1 className="text-3xl text-ink">Dashboard</h1>
        <p className="mt-1.5 text-sm text-muted">
          Portfolio health, occupancy, and operations at a glance.
        </p>
        <p className="mt-3 text-xs uppercase tracking-[0.14em] text-muted">
          Last 30 days · updated {updated}
        </p>
      </motion.div>

      <div className="grid gap-3 sm:grid-cols-2">
        <IntegrationCard
          name="Airbnb"
          blurb="Sync reservations and calendars automatically."
          onConnect={() => toast.notify("Airbnb OAuth flow coming soon")}
        />
        <IntegrationCard
          name="WhatsApp"
          blurb="Message guests and automate replies in one inbox."
          onConnect={() =>
            toast.notify("WhatsApp Business connection coming soon")
          }
        />
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricTile
          label="Upcoming stays"
          value={num(stats?.upcoming)}
          hint="Confirmed reservations"
          href="/bookings"
          accent="#2f86d6"
        />
        <MetricTile
          label="In-house now"
          value={num(stats?.inHouse)}
          hint="Guests checked in"
          href="/bookings"
          accent="#2e9e6b"
        />
        <MetricTile
          label="Cleans due"
          value="4"
          hint="Sample · connect ops"
          href="/housekeeping"
          accent="#8a6d3b"
        />
        <MetricTile
          label="Open issues"
          value="4"
          hint="Sample · connect ops"
          href="/maintenance"
          accent="#c2410c"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-line bg-card p-5">
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted">
            Occupancy
          </p>
          <p className="mt-1.5 font-display text-2xl text-ink">84%</p>
          <p className="mt-1 text-xs text-muted">Last 30 days · sample</p>
        </div>
        <div className="rounded-2xl border border-line bg-card p-5">
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted">
            ADR
          </p>
          <p className="mt-1.5 font-display text-2xl text-ink">$246</p>
          <p className="mt-1 text-xs text-muted">Last 30 days · sample</p>
        </div>
        <div className="rounded-2xl border border-line bg-card p-5">
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted">
            RevPAR
          </p>
          <p className="mt-1.5 font-display text-2xl text-ink">$206</p>
          <p className="mt-1 text-xs text-muted">Last 30 days · sample</p>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-card p-6">
        <p className="font-display text-lg text-ink">
          Today’s Operations Snapshot
        </p>
        <ul className="mt-3 space-y-2 text-sm text-muted">
          <li>
            • {num(stats?.upcoming)} upcoming reservations across the portfolio.
          </li>
          <li>• {num(stats?.inHouse)} guests currently in-house.</li>
          <li>
            • {num(stats?.total)} reservations tracked with double-booking
            protection.
          </li>
        </ul>
      </div>

      <div>
        <p className="mb-2 text-[11px] uppercase tracking-[0.14em] text-muted">
          Quick actions
        </p>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <QuickAction label="Guest Messages" href="/messages" />
          <QuickAction label="Housekeeping" href="/housekeeping" />
          <QuickAction label="Inventory" href="/inventory" />
          <QuickAction label="Master Calendar" href="/calendar" />
        </div>
      </div>
    </section>
  );
};
