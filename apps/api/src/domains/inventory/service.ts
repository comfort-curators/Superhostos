import type {
  InventoryItem,
  OrderResult,
  OverrideSignal,
  ReplenishmentPlan,
} from "./contracts";
import { SharedMemory } from "./memory";
import { InventoryOrchestrator } from "./orchestrator";
import { InventoryRepository } from "./repository";

export class InventoryError extends Error {
  constructor(
    readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "InventoryError";
  }
}

// How much an operational cycle nudges the adaptive sensitivity parameter beta.
const BETA_STEP = 0.5;

/**
 * Application service tying the inventory domain together: it threads the
 * per-cycle budget across items to build a replenishment plan, commits orders,
 * and feeds outcomes back into the shared memory layer — adapting vendor
 * reliability, per-agent consensus weights, and the softmax sensitivity beta.
 */
export class InventoryService {
  private readonly orchestrator: InventoryOrchestrator;

  constructor(
    private readonly repository: InventoryRepository = new InventoryRepository(),
    private readonly memory: SharedMemory = new SharedMemory(),
  ) {
    this.orchestrator = new InventoryOrchestrator(this.repository, this.memory);
  }

  listItems(propertyId?: string): Promise<InventoryItem[]> {
    return this.repository.listItems(propertyId);
  }

  sharedMemory(): SharedMemory {
    return this.memory;
  }

  async plan(
    propertyId: string,
    horizonDays: number,
    now: Date = new Date(),
    override?: OverrideSignal,
  ): Promise<ReplenishmentPlan> {
    const items = await this.repository.listItems(propertyId);
    if (items.length === 0)
      throw new InventoryError(404, `No inventory for property ${propertyId}`);

    let budget = this.repository.budgetFor(propertyId);
    if (override?.authorized && override.budget !== undefined) {
      budget = override.budget;
      this.memory.recordOverride("budget", budget);
    }

    // Sequential: the budget is threaded across items as decisions are made.
    let remaining = budget - this.memory.getSpent(propertyId);
    const decisions: ReplenishmentPlan["decisions"] = [];
    for (const item of items) {
      const decision = await this.orchestrator.decide(
        item,
        horizonDays,
        remaining,
        now,
        override,
      );
      remaining -= decision.estimatedCost;
      decisions.push(decision);
    }

    return {
      propertyId,
      horizonDays,
      budget,
      budgetRemaining: Math.max(0, remaining),
      beta: this.memory.getBeta(),
      memoryVersion: this.memory.version,
      decisions,
    };
  }

  /**
   * Execute the current plan: place each recommended order, simulate the
   * delivery outcome, and feed it back into the shared memory layer so vendor
   * reliability, consensus weights, and beta adapt over cycles (patent §4.5).
   */
  async execute(
    propertyId: string,
    horizonDays: number,
    simulateOutcome?: "success" | "failure",
    override?: OverrideSignal,
    now: Date = new Date(),
  ): Promise<OrderResult[]> {
    const plan = await this.plan(propertyId, horizonDays, now, override);

    const results: OrderResult[] = [];
    for (const decision of plan.decisions) {
      if (decision.recommendedQty <= 0 || !decision.selectedVendorId) continue;
      const vendor = await this.repository.findVendor(
        decision.selectedVendorId,
      );
      if (!vendor) continue;

      const reliability = this.memory.getReliability(
        vendor.id,
        vendor.reliability,
      );
      const success = simulateOutcome
        ? simulateOutcome === "success"
        : Math.random() < reliability;

      let newOnHand = decision.onHand;
      if (success) {
        this.memory.recordSpend(propertyId, decision.estimatedCost);
        newOnHand =
          (
            await this.repository.adjustOnHand(
              decision.itemId,
              decision.recommendedQty,
            )
          )?.onHand ?? decision.onHand;
      }
      const reliabilityAfter = this.memory.updateReliability(
        vendor.id,
        vendor.reliability,
        success,
      );
      // Reinforce the agents that backed this order.
      this.memory.updateAgentWeight("vendor", success);
      this.memory.updateAgentWeight("reliability", success);

      results.push({
        itemId: decision.itemId,
        sku: decision.sku,
        orderedQty: success ? decision.recommendedQty : 0,
        vendorId: vendor.id,
        vendorName: vendor.name,
        cost: success ? decision.estimatedCost : 0,
        outcome: success ? "success" : "failure",
        newOnHand,
        vendorReliabilityAfter: reliabilityAfter,
        mode: decision.mode,
        notes: success
          ? decision.notes
          : [
              ...decision.notes,
              "Delivery failed; reliability penalised, no charge applied",
            ],
      });
    }

    // Adapt beta from the cycle outcome: reward sharpens exploitation, failure
    // widens exploration.
    if (results.length > 0) {
      const successRate =
        results.filter((r) => r.outcome === "success").length / results.length;
      this.memory.updateBeta(successRate >= 0.5 ? BETA_STEP : -BETA_STEP);
    }

    return results;
  }
}
