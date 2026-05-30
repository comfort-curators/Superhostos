import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { fetchBookings } from "../api/client";
import { LoadingSkeleton } from "../components/LoadingSkeleton";

const PALETTE = [
  "#8a6d3b",
  "#7c5cff",
  "#2f86d6",
  "#2e9e6b",
  "#c2410c",
  "#9333ea",
];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const iso = (d: Date) => d.toISOString().slice(0, 10);
const monthLabel = (d: Date) =>
  d.toLocaleString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

interface Cell {
  key: string;
  day: string | null;
}

function monthCells(cursor: Date): Cell[] {
  const year = cursor.getUTCFullYear();
  const month = cursor.getUTCMonth();
  const startPad = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells: Cell[] = [];
  for (let i = 0; i < startPad; i += 1)
    cells.push({ key: `pad-start-${i}`, day: null });
  for (let d = 1; d <= daysInMonth; d += 1) {
    const day = iso(new Date(Date.UTC(year, month, d)));
    cells.push({ key: day, day });
  }
  let trailing = 0;
  while (cells.length % 7 !== 0) {
    cells.push({ key: `pad-end-${trailing}`, day: null });
    trailing += 1;
  }
  return cells;
}

export const CalendarPage = () => {
  const {
    data: bookings,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["bookings", "calendar"],
    queryFn: () => fetchBookings(),
  });
  const [cursor, setCursor] = useState(() => {
    const n = new Date();
    return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), 1));
  });

  // Cancelled stays never block availability, so they're not shown.
  const active = useMemo(
    () => (bookings ?? []).filter((b) => b.status !== "cancelled"),
    [bookings],
  );

  const colorFor = useMemo(() => {
    const ids = Array.from(new Set(active.map((b) => b.propertyId)));
    return new Map(
      ids.map(
        (id, i) => [id, PALETTE[i % PALETTE.length] ?? PALETTE[0]] as const,
      ),
    );
  }, [active]);

  const properties = useMemo(() => {
    const m = new Map<string, string>();
    for (const b of active) m.set(b.propertyId, b.propertyName);
    return Array.from(m, ([id, name]) => ({ id, name }));
  }, [active]);

  const cells = useMemo(() => monthCells(cursor), [cursor]);
  const shift = (delta: number) =>
    setCursor(
      (c) => new Date(Date.UTC(c.getUTCFullYear(), c.getUTCMonth() + delta, 1)),
    );
  const today = iso(new Date());

  const navBtn =
    "grid h-9 w-9 place-items-center rounded-full border border-line bg-card text-ink transition-colors hover:bg-sand/60";

  return (
    <section className="space-y-4 pb-20 md:pb-0">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-line bg-card p-7 shadow-[0_1px_2px_rgba(27,25,22,0.04)]"
      >
        <div>
          <h1 className="text-3xl text-ink">Master Calendar</h1>
          <p className="mt-1.5 text-sm text-muted">
            Unified availability across every property.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Previous month"
            className={navBtn}
            onClick={() => shift(-1)}
          >
            ‹
          </button>
          <span className="min-w-44 text-center font-display text-xl text-ink">
            {monthLabel(cursor)}
          </span>
          <button
            type="button"
            aria-label="Next month"
            className={navBtn}
            onClick={() => shift(1)}
          >
            ›
          </button>
        </div>
      </motion.div>

      {isError ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-700">
          Failed to load the calendar.
        </p>
      ) : null}

      {isLoading ? (
        <LoadingSkeleton rows={6} />
      ) : (
        <div className="overflow-hidden rounded-3xl border border-line bg-card">
          <div className="grid grid-cols-7 border-b border-line">
            {WEEKDAYS.map((w) => (
              <div
                key={w}
                className="px-2 py-2 text-center text-[11px] uppercase tracking-[0.12em] text-muted"
              >
                {w}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {cells.map(({ key, day }) => {
              const dayBookings = day
                ? active.filter((b) => b.checkIn <= day && day < b.checkOut)
                : [];
              return (
                <div
                  key={key}
                  className={`min-h-[96px] border-b border-r border-line p-1.5 last:border-r-0 ${day ? "" : "bg-sand/25"}`}
                >
                  {day ? (
                    <>
                      <div
                        className={`mb-1 text-xs ${day === today ? "inline-grid h-5 w-5 place-items-center rounded-full bg-ink font-medium text-ivory" : "text-muted"}`}
                      >
                        {Number(day.slice(8))}
                      </div>
                      <div className="space-y-1">
                        {dayBookings.slice(0, 3).map((b) => (
                          <div
                            key={b.id}
                            className="truncate rounded px-1.5 py-0.5 text-[10px] font-medium text-white"
                            style={{
                              backgroundColor:
                                colorFor.get(b.propertyId) ?? PALETTE[0],
                            }}
                            title={`${b.guestName} · ${b.propertyName}`}
                          >
                            {b.guestName.split(" ")[0]}
                          </div>
                        ))}
                        {dayBookings.length > 3 ? (
                          <div className="text-[10px] text-muted">
                            +{dayBookings.length - 3} more
                          </div>
                        ) : null}
                      </div>
                    </>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {properties.length > 0 ? (
        <div className="flex flex-wrap gap-x-5 gap-y-2 rounded-2xl border border-line bg-card p-4">
          {properties.map((p) => (
            <span
              key={p.id}
              className="flex items-center gap-2 text-sm text-ink"
            >
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: colorFor.get(p.id) ?? PALETTE[0] }}
              />
              {p.name}
            </span>
          ))}
        </div>
      ) : !isLoading ? (
        <p className="rounded-2xl border border-line bg-card p-4 text-sm text-muted">
          No bookings to display this month yet.
        </p>
      ) : null}
    </section>
  );
};
