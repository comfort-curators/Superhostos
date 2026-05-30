import { z } from "zod";

// --- Inventory items ------------------------------------------------------
export const inventoryCategorySchema = z.enum([
  "amenities",
  "linen",
  "consumables",
  "cleaning",
  "minibar",
]);
export type InventoryCategory = z.infer<typeof inventoryCategorySchema>;

export const inventoryItemSchema = z.object({
  id: z.string().uuid(),
  propertyId: z.string().uuid(),
  sku: z.string(),
  name: z.string(),
  category: inventoryCategorySchema,
  unit: z.string(),
  onHand: z.number().nonnegative(),
  // Par level is the minimum on-hand quantity we never want to fall below.
  parLevel: z.number().nonnegative(),
  // Baseline units consumed per occupied-room-night, before occupancy scaling.
  baseDailyUsage: z.number().nonnegative(),
});
export type InventoryItem = z.infer<typeof inventoryItemSchema>;

// --- Vendor options -------------------------------------------------------
export const vendorOptionSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  // SKUs this vendor can fulfil.
  skus: z.array(z.string()),
  unitPrice: z.number().positive(),
  leadTimeDays: z.number().positive(),
  // Reliability in [0, 1]; updated over time by the reinforcement layer.
  reliability: z.number().min(0).max(1),
});
export type VendorOption = z.infer<typeof vendorOptionSchema>;

// --- Decision output ------------------------------------------------------
export const decisionModeSchema = z.enum([
  "optimized",
  "consensus_buffered",
  "fallback",
  "skipped",
]);
export type DecisionMode = z.infer<typeof decisionModeSchema>;

export const vendorScoreSchema = z.object({
  vendorId: z.string().uuid(),
  vendorName: z.string(),
  utility: z.number(),
  probability: z.number(),
});
export type VendorScore = z.infer<typeof vendorScoreSchema>;

export const replenishmentDecisionSchema = z.object({
  itemId: z.string().uuid(),
  sku: z.string(),
  name: z.string(),
  propertyId: z.string().uuid(),
  occupancyRate: z.number(),
  forecastDemand: z.number(),
  safetyBuffer: z.number(),
  onHand: z.number(),
  recommendedQty: z.number(),
  selectedVendorId: z.string().uuid().nullable(),
  selectedVendorName: z.string().nullable(),
  vendorScores: z.array(vendorScoreSchema),
  // Per-agent opinions reconciled by the consensus protocol.
  consensusContributors: z.array(
    z.object({ agent: z.string(), weight: z.number() }),
  ),
  confidence: z.number(),
  entropy: z.number(),
  betaUsed: z.number(),
  estimatedCost: z.number(),
  withinBudget: z.boolean(),
  mode: decisionModeSchema,
  notes: z.array(z.string()),
});
export type ReplenishmentDecision = z.infer<typeof replenishmentDecisionSchema>;

export const replenishmentPlanSchema = z.object({
  propertyId: z.string().uuid(),
  horizonDays: z.number(),
  budget: z.number(),
  budgetRemaining: z.number(),
  beta: z.number(),
  memoryVersion: z.number(),
  decisions: z.array(replenishmentDecisionSchema),
});
export type ReplenishmentPlan = z.infer<typeof replenishmentPlanSchema>;

// --- Priority override (patent §4.6) --------------------------------------
// An authorized operator may override constraints. Honoured only when
// `authorized` is true; every applied override is logged to shared memory.
export const overrideSignalSchema = z.object({
  authorized: z.boolean(),
  budget: z.number().nonnegative().optional(),
  forceVendorId: z.string().uuid().optional(),
});
export type OverrideSignal = z.infer<typeof overrideSignalSchema>;

// --- Request payloads -----------------------------------------------------
export const planQuerySchema = z.object({
  propertyId: z.string().uuid(),
  horizonDays: z.coerce.number().int().positive().max(90).default(14),
});

export const executeBodySchema = z.object({
  propertyId: z.string().uuid(),
  horizonDays: z.number().int().positive().max(90).default(14),
  // Optional override: simulate a delivery failure to exercise the RL update.
  simulateOutcome: z.enum(["success", "failure"]).optional(),
  override: overrideSignalSchema.optional(),
});

export const orderResultSchema = z.object({
  itemId: z.string().uuid(),
  sku: z.string(),
  orderedQty: z.number(),
  vendorId: z.string().uuid().nullable(),
  vendorName: z.string().nullable(),
  cost: z.number(),
  outcome: z.enum(["success", "failure"]),
  newOnHand: z.number(),
  vendorReliabilityAfter: z.number().nullable(),
  mode: decisionModeSchema,
  notes: z.array(z.string()),
});
export type OrderResult = z.infer<typeof orderResultSchema>;
