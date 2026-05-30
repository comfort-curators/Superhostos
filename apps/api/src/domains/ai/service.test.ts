import { describe, expect, it } from "vitest";
import { GuestReplyService, __test } from "./service";

describe("GuestReplyService (fallback path)", () => {
  it("returns a courteous templated reply when no AI key is configured", async () => {
    const service = new GuestReplyService();
    const result = await service.generate({
      guestName: "Sarah",
      propertyName: "Azure Bay Villa",
      message: "Is there a coffee machine?",
    });
    expect(result.provider).toBe("fallback");
    expect(result.reply).toContain("Sarah");
    expect(result.reply).toContain("Azure Bay Villa");
    expect(result.promptTokens).toBe(0);
  });

  it("validates that a message is required", async () => {
    const service = new GuestReplyService();
    await expect(service.generate({ guestName: "Sarah" })).rejects.toThrow();
  });
});

describe("prompt construction", () => {
  it("includes property, guest, message and amenities", () => {
    const prompt = __test.buildPrompt({
      guestName: "Marco",
      propertyName: "Alpine Chalet",
      message: "The hot tub is cold.",
      amenities: ["Hot tub", "Wifi"],
      tone: "warm",
    });
    expect(prompt).toContain("Alpine Chalet");
    expect(prompt).toContain("Marco");
    expect(prompt).toContain("hot tub is cold");
    expect(prompt).toContain("Hot tub, Wifi");
  });
});
