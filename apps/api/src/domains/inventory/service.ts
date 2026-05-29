import type { InventoryItem, OrderResult, ReplenishmentPlan } from './contracts';
import { SharedMemory } from './memory';
import { InventoryOrchestrator } from './orchestrator';
import { InventoryRepository } from './repository';

export class InventoryError extends Error {
  constructor(
    readonly statusCode: number,
    message: string
  ) {
    super(message);
    this.name = 'InventoryError';
  }
}

/**
 * Application service tying the inventory domain together: it threads the
 * per-cycle budget across items to build a replenishment plan, and commits
 * orders — updating stock, the budget ledger, and (via the reinforcement layer)
 * vendor reliability based on delivery outcomes.
 */
export class InventoryService {
  private readonly orchestrator: InventoryOrchestrator;

  constructor(
    private readonly repository: InventoryRepository = new InventoryRepository(),
    private readonly memory: SharedMemory = new SharedMemory()
  ) {
    this.orchestrator = new InventoryOrchestrator(this.repository, this.memory);
  }

  listItems(propertyId?: string): InventoryItem[] {
    return this.repository.listItems(propertyId);
  }

  plan(propertyId: string, horizonDays: number, now: Date = new Date()): ReplenishmentPlan {
    const items = this.repository.listItems(propertyId);
    if (items.length === 0) throw new InventoryError(404, `No inventory for property ${propertyId}`);

    const budget = this.repository.budgetFor(propertyId);
    let remaining = budget - this.memory.getSpent(propertyId);

    const decisions = items.map((item) => {
      const decision = this.orchestrator.decide(item, horizonDays, remaining, now);
      remaining -= decision.estimatedCost;
      return decision;
    });

    return { propertyId, horizonDays, budget, budgetRemaining: Math.max(0, remaining), decisions };
  }

  /**
   * Execute the current plan: place each recommended order, simulate the
   * delivery outcome, and feed it back into the shared memory layer so vendor
   * reliability adapts over operational cycles (patent §4.7).
   */
  execute(propertyId: string, horizonDays: number, simulateOutcome?: 'success' | 'failure', now: Date = new Date()): OrderResult[] {
    const plan = this.plan(propertyId, horizonDays, now);

    const results: OrderResult[] = [];
    for (const decision of plan.decisions) {
      if (decision.recommendedQty <= 0 || !decision.selectedVendorId) continue;
      const vendor = this.repository.findVendor(decision.selectedVendorId);
      if (!vendor) continue;

      const reliability = this.memory.getReliability(vendor.id, vendor.reliability);
      const success = simulateOutcome ? simulateOutcome === 'success' : Math.random() < reliability;

      let newOnHand = decision.onHand;
      if (success) {
        this.memory.recordSpend(propertyId, decision.estimatedCost);
        newOnHand = this.repository.adjustOnHand(decision.itemId, decision.recommendedQty)?.onHand ?? decision.onHand;
      }
      const reliabilityAfter = this.memory.updateReliability(vendor.id, vendor.reliability, success);

      results.push({
        itemId: decision.itemId,
        sku: decision.sku,
        orderedQty: success ? decision.recommendedQty : 0,
        vendorId: vendor.id,
        vendorName: vendor.name,
        cost: success ? decision.estimatedCost : 0,
        outcome: success ? 'success' : 'failure',
        newOnHand,
        vendorReliabilityAfter: reliabilityAfter,
        mode: decision.mode,
        notes: success ? decision.notes : [...decision.notes, 'Delivery failed; reliability penalised, no charge applied']
      });
    }

    return results;
  }
}
