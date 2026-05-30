import { describe, expect, it } from "vitest";
import { PropertiesRepository } from "../properties/repository";
import { BookingsRepository } from "./repository";
import { BookingError, BookingsService } from "./service";

const PROPERTY = "00000000-0000-0000-0000-000000000001";

function freshService() {
  return new BookingsService(
    new BookingsRepository(),
    new PropertiesRepository(),
  );
}

const base = {
  propertyId: PROPERTY,
  source: "direct" as const,
  guestName: "Test Guest",
  guestCount: 2,
  checkIn: "2026-09-01",
  checkOut: "2026-09-05",
  totalAmount: 500,
};

describe("BookingsService.create", () => {
  it("creates a confirmed booking and assigns a reservation id", async () => {
    const service = freshService();
    const booking = await service.create(base);
    expect(booking.status).toBe("confirmed");
    expect(booking.externalReservationId).toMatch(/^SHO-/);
    expect(booking.propertyName).toBe("Nobu Penthouse");
  });

  it("rejects an unknown property with a 404", async () => {
    const service = freshService();
    await expect(
      service.create({
        ...base,
        propertyId: "00000000-0000-0000-0000-0000000000ff",
      }),
    ).rejects.toBeInstanceOf(BookingError);
  });

  it("rejects overlapping dates on the same property with a 409", async () => {
    const service = freshService();
    await service.create(base);
    await expect(
      service.create({
        ...base,
        checkIn: "2026-09-03",
        checkOut: "2026-09-07",
      }),
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it("allows a same-day turnover (checkout day == next checkin day)", async () => {
    const service = freshService();
    await service.create(base); // 09-01 -> 09-05
    const next = await service.create({
      ...base,
      checkIn: "2026-09-05",
      checkOut: "2026-09-08",
    });
    expect(next.status).toBe("confirmed");
  });

  it("allows overlapping dates on a different property", async () => {
    const service = freshService();
    await service.create(base);
    const other = await service.create({
      ...base,
      propertyId: "00000000-0000-0000-0000-000000000002",
    });
    expect(other.propertyName).toBe("Palm Loft");
  });

  it("lets a cancelled booking free up its dates", async () => {
    const service = freshService();
    const first = await service.create(base);
    await service.cancel(first.id);
    const reused = await service.create(base);
    expect(reused.status).toBe("confirmed");
  });
});

describe("BookingsService lifecycle", () => {
  it("advances confirmed -> checked_in -> checked_out", async () => {
    const service = freshService();
    const booking = await service.create(base);
    expect((await service.checkIn(booking.id)).status).toBe("checked_in");
    expect((await service.checkOut(booking.id)).status).toBe("checked_out");
  });

  it("rejects an invalid transition with a 409", async () => {
    const service = freshService();
    const booking = await service.create(base);
    await expect(service.checkOut(booking.id)).rejects.toBeInstanceOf(
      BookingError,
    ); // confirmed -> checked_out not allowed
  });

  it("cannot cancel a checked_out booking", async () => {
    const service = freshService();
    const booking = await service.create(base);
    await service.checkIn(booking.id);
    await service.checkOut(booking.id);
    await expect(service.cancel(booking.id)).rejects.toBeInstanceOf(
      BookingError,
    );
  });
});

describe("BookingsService.stats", () => {
  it("summarises bookings by status", async () => {
    const service = freshService();
    const stats = await service.stats();
    expect(stats.total).toBeGreaterThan(0);
    expect(stats.upcoming).toBe(stats.byStatus.confirmed ?? 0);
    expect(stats.inHouse).toBe(stats.byStatus.checked_in ?? 0);
  });
});
