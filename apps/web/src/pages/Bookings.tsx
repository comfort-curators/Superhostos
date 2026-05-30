import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import {
  type BookingDto,
  type BookingSource,
  type CreateBookingInput,
  cancelBooking,
  checkInBooking,
  checkOutBooking,
  createBooking,
  fetchBookingStats,
  fetchBookings,
} from "../api/client";
import { LoadingSkeleton } from "../components/LoadingSkeleton";
import { useToast } from "../components/Toast";
import { useProperties } from "../hooks/useProperties";

const STATUS_FILTERS = [
  "all",
  "confirmed",
  "checked_in",
  "checked_out",
  "cancelled",
] as const;
const SOURCES: BookingSource[] = ["direct", "airbnb", "booking_com", "vrbo"];

const STATUS_STYLES: Record<BookingDto["status"], string> = {
  confirmed: "bg-blue-100 text-blue-700",
  checked_in: "bg-emerald-100 text-emerald-700",
  checked_out: "bg-stone-200 text-muted",
  cancelled: "bg-rose-100 text-rose-700",
};

const StatCard = ({
  label,
  value,
}: { label: string; value: string | number }) => (
  <div className="rounded-2xl border border-line bg-card p-4">
    <p className="text-xs text-muted">{label}</p>
    <p className="mt-1 font-display text-2xl text-ink">{value}</p>
  </div>
);

const emptyForm = (propertyId: string): CreateBookingInput => ({
  propertyId,
  source: "direct",
  guestName: "",
  guestCount: 2,
  checkIn: "",
  checkOut: "",
  totalAmount: 0,
});

export const BookingsPage = () => {
  const qc = useQueryClient();
  const toast = useToast();
  const [statusFilter, setStatusFilter] =
    useState<(typeof STATUS_FILTERS)[number]>("all");
  const { data: properties } = useProperties();
  const [form, setForm] = useState<CreateBookingInput>(emptyForm(""));

  const {
    data: bookings,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["bookings", statusFilter],
    queryFn: () => fetchBookings(statusFilter),
  });
  const { data: stats } = useQuery({
    queryKey: ["bookings", "stats"],
    queryFn: fetchBookingStats,
  });

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["bookings"] });
  };

  const createMutation = useMutation({
    mutationFn: () => createBooking(form),
    onSuccess: (b) => {
      setForm(emptyForm(form.propertyId));
      refresh();
      toast.success(`Booking confirmed for ${b.guestName}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const checkInMutation = useMutation({
    mutationFn: checkInBooking,
    onSuccess: (b) => {
      refresh();
      toast.success(`${b.guestName} checked in`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const checkOutMutation = useMutation({
    mutationFn: checkOutBooking,
    onSuccess: (b) => {
      refresh();
      toast.success(`${b.guestName} checked out`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const cancelMutation = useMutation({
    mutationFn: cancelBooking,
    onSuccess: (b) => {
      refresh();
      toast.notify(`Booking for ${b.guestName} cancelled`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const defaultPropertyId = properties?.[0]?.id ?? "";
  const selectedPropertyId = form.propertyId || defaultPropertyId;
  const canSubmit =
    selectedPropertyId &&
    form.guestName.trim() &&
    form.checkIn &&
    form.checkOut > form.checkIn;

  const nights = useMemo(() => {
    if (!form.checkIn || !form.checkOut) return 0;
    const ms =
      new Date(form.checkOut).getTime() - new Date(form.checkIn).getTime();
    return ms > 0 ? Math.round(ms / 86_400_000) : 0;
  }, [form.checkIn, form.checkOut]);

  return (
    <section className="space-y-4 pb-20 md:pb-0">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="rounded-3xl border border-line bg-card p-6 shadow-sm"
      >
        <h1 className="text-2xl font-semibold tracking-tight">Bookings</h1>
        <p className="mt-1 text-sm text-muted">
          Reservations across every property, with double-booking protection.
        </p>
      </motion.div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Total" value={stats?.total ?? 0} />
        <StatCard label="Upcoming" value={stats?.upcoming ?? 0} />
        <StatCard label="In-house" value={stats?.inHouse ?? 0} />
        <StatCard label="Cancelled" value={stats?.byStatus.cancelled ?? 0} />
      </div>

      <div className="rounded-3xl border border-line bg-card p-5">
        <p className="text-sm font-medium">New reservation</p>
        <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3">
          <select
            value={selectedPropertyId}
            onChange={(e) =>
              setForm((f) => ({ ...f, propertyId: e.target.value }))
            }
            className="rounded-2xl border px-3 py-2 text-sm"
          >
            {properties?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <input
            value={form.guestName}
            onChange={(e) =>
              setForm((f) => ({ ...f, guestName: e.target.value }))
            }
            placeholder="Guest name"
            className="rounded-2xl border px-3 py-2 text-sm"
          />
          <select
            value={form.source}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                source: e.target.value as BookingSource,
              }))
            }
            className="rounded-2xl border px-3 py-2 text-sm"
          >
            {SOURCES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <label className="text-xs text-muted">
            Check-in
            <input
              type="date"
              value={form.checkIn}
              onChange={(e) =>
                setForm((f) => ({ ...f, checkIn: e.target.value }))
              }
              className="mt-1 w-full rounded-2xl border px-3 py-2 text-sm"
            />
          </label>
          <label className="text-xs text-muted">
            Check-out
            <input
              type="date"
              value={form.checkOut}
              onChange={(e) =>
                setForm((f) => ({ ...f, checkOut: e.target.value }))
              }
              className="mt-1 w-full rounded-2xl border px-3 py-2 text-sm"
            />
          </label>
          <label className="text-xs text-muted">
            Guests
            <input
              type="number"
              min={1}
              value={form.guestCount}
              onChange={(e) =>
                setForm((f) => ({ ...f, guestCount: Number(e.target.value) }))
              }
              className="mt-1 w-full rounded-2xl border px-3 py-2 text-sm"
            />
          </label>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            disabled={!canSubmit || createMutation.isPending}
            className="rounded-2xl bg-ink px-4 py-2 text-sm text-ivory disabled:opacity-40"
            onClick={() => createMutation.mutate()}
          >
            {createMutation.isPending
              ? "Creating…"
              : `Create booking${nights ? ` · ${nights} night${nights > 1 ? "s" : ""}` : ""}`}
          </button>
          {createMutation.isError ? (
            <span className="text-sm text-rose-600">
              {(createMutation.error as Error).message}
            </span>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => setStatusFilter(filter)}
            className={`rounded-2xl border px-3 py-2 text-sm capitalize ${statusFilter === filter ? "bg-ink text-ivory" : "bg-card"}`}
          >
            {filter.replace("_", " ")}
          </button>
        ))}
      </div>

      {isLoading ? <LoadingSkeleton rows={4} /> : null}
      {isError ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-700">
          Failed to load bookings.
        </p>
      ) : null}

      <div className="space-y-2">
        {bookings?.map((b) => (
          <article
            key={b.id}
            className="rounded-2xl border border-line bg-card p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-medium">
                  {b.guestName} · {b.propertyName}
                </p>
                <p className="text-sm text-muted">
                  {b.checkIn} → {b.checkOut} · {b.guestCount} guests ·{" "}
                  {b.source} · {b.externalReservationId}
                </p>
              </div>
              <span
                className={`rounded-full px-2 py-1 text-xs capitalize ${STATUS_STYLES[b.status]}`}
              >
                {b.status.replace("_", " ")}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium">
                ${b.totalAmount.toLocaleString()}
              </span>
              <button
                type="button"
                disabled={b.status !== "confirmed" || checkInMutation.isPending}
                className="rounded-xl border px-3 py-1 text-xs disabled:opacity-40"
                onClick={() => checkInMutation.mutate(b.id)}
              >
                Check in
              </button>
              <button
                type="button"
                disabled={
                  b.status !== "checked_in" || checkOutMutation.isPending
                }
                className="rounded-xl border px-3 py-1 text-xs disabled:opacity-40"
                onClick={() => checkOutMutation.mutate(b.id)}
              >
                Check out
              </button>
              <button
                type="button"
                disabled={
                  (b.status !== "confirmed" && b.status !== "checked_in") ||
                  cancelMutation.isPending
                }
                className="rounded-xl border px-3 py-1 text-xs text-rose-600 disabled:opacity-40"
                onClick={() => cancelMutation.mutate(b.id)}
              >
                Cancel
              </button>
            </div>
          </article>
        ))}
        {bookings?.length === 0 ? (
          <p className="rounded-xl border border-line bg-card p-4 text-sm text-muted">
            No bookings match this filter.
          </p>
        ) : null}
      </div>
    </section>
  );
};
