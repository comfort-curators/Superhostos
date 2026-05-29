import type { ReplenishmentDecision } from './contracts';
import { clamp } from './math';

/**
 * Shared contextual memory layer (patent §4.4, §4.7).
 *
 * Provides persistent, synchronised state that the agents read from and write
 * to without coupling directly to one another:
 *  - RL-adjusted vendor reliability weights (updated from observed outcomes)
 *  - per-property budget ledgers for the current operational cycle
 *  - the most recent decision per item, for inspection and learning
 *
 * Implemented in-process for now; the interface is deliberately storage-shaped
 * so it can be backed by Redis/Postgres without touching the agents.
 */
export class SharedMemory {
  private readonly reliabilityOverrides = new Map<string, number>();
  private readonly budgetSpent = new Map<string, number>();
  private readonly lastDecisions = new Map<string, ReplenishmentDecision>();

  // --- vendor reliability (reinforcement learning) ---
  getReliability(vendorId: string, seed: number): number {
    return this.reliabilityOverrides.get(vendorId) ?? seed;
  }

  /**
   * Exponential-moving-average update toward the observed outcome
   * (1 = delivered as promised, 0 = failed). `alpha` is the learning rate;
   * higher alpha weights recent outcomes more heavily.
   */
  updateReliability(vendorId: string, seed: number, success: boolean, alpha = 0.2): number {
    const current = this.getReliability(vendorId, seed);
    const target = success ? 1 : 0;
    const updated = clamp((1 - alpha) * current + alpha * target, 0, 1);
    this.reliabilityOverrides.set(vendorId, updated);
    return updated;
  }

  // --- budget ledger ---
  getSpent(propertyId: string): number {
    return this.budgetSpent.get(propertyId) ?? 0;
  }

  recordSpend(propertyId: string, amount: number): void {
    this.budgetSpent.set(propertyId, this.getSpent(propertyId) + amount);
  }

  resetBudget(propertyId: string): void {
    this.budgetSpent.delete(propertyId);
  }

  // --- decision log ---
  recordDecision(decision: ReplenishmentDecision): void {
    this.lastDecisions.set(decision.itemId, decision);
  }

  getDecision(itemId: string): ReplenishmentDecision | undefined {
    return this.lastDecisions.get(itemId);
  }
}
