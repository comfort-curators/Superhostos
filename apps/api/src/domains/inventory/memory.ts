import type { ReplenishmentDecision } from './contracts';
import { clamp } from './math';

export const DEFAULT_BETA = 6;
const BETA_MIN = 0; // 0 = full exploration (uniform softmax)
const BETA_MAX = 20;

export interface MemoryVersionEntry {
  version: number;
  timestamp: string;
  agent: string;
  kind: 'reliability' | 'spend' | 'decision' | 'beta' | 'agent_weight' | 'override';
  key: string;
  value: number | string;
}

export interface MemorySnapshot {
  version: number;
  beta: number;
  reliability: Record<string, number>;
  spend: Record<string, number>;
  agentWeights: Record<string, number>;
  log: MemoryVersionEntry[];
}

/**
 * Shared contextual memory layer (patent §4.2, §4.4, §4.7).
 *
 * A structured, persistent, versioned context store that all agents read from
 * and write to without coupling directly to one another. It maintains:
 *  - RL-adjusted vendor reliability weights
 *  - per-agent reliability weights used by the consensus protocol
 *  - the adaptive softmax sensitivity parameter beta
 *  - per-property budget ledgers for the current operational cycle
 *  - the latest decision per item
 *
 * Every mutation is appended to an immutable, monotonically-versioned log,
 * giving a queryable interaction history (for learning and audit) and a single
 * source of truth that can be snapshotted and restored across sessions. The
 * store is in-process today but `snapshot()`/`restore()` make it persistable to
 * Redis/Postgres/disk without touching the agents.
 */
export class SharedMemory {
  private currentVersion = 0;
  private beta = DEFAULT_BETA;
  private readonly reliabilityOverrides = new Map<string, number>();
  private readonly agentWeights = new Map<string, number>();
  private readonly budgetSpent = new Map<string, number>();
  private readonly lastDecisions = new Map<string, ReplenishmentDecision>();
  private readonly log: MemoryVersionEntry[] = [];

  get version(): number {
    return this.currentVersion;
  }

  private commit(agent: string, kind: MemoryVersionEntry['kind'], key: string, value: number | string): number {
    this.currentVersion += 1;
    this.log.push({ version: this.currentVersion, timestamp: new Date().toISOString(), agent, kind, key, value });
    return this.currentVersion;
  }

  // --- adaptive sensitivity (beta) ---
  getBeta(): number {
    return this.beta;
  }

  /** Nudge beta toward exploitation (positive) or exploration (negative). */
  updateBeta(delta: number): number {
    this.beta = clamp(this.beta + delta, BETA_MIN, BETA_MAX);
    this.commit('rl', 'beta', 'beta', this.beta);
    return this.beta;
  }

  // --- vendor reliability (reinforcement learning) ---
  getReliability(vendorId: string, seed: number): number {
    return this.reliabilityOverrides.get(vendorId) ?? seed;
  }

  /**
   * Exponential-moving-average update toward the observed outcome
   * (1 = delivered as promised, 0 = failed). `alpha` is the learning rate.
   */
  updateReliability(vendorId: string, seed: number, success: boolean, alpha = 0.2): number {
    const current = this.getReliability(vendorId, seed);
    const updated = clamp((1 - alpha) * current + alpha * (success ? 1 : 0), 0, 1);
    this.reliabilityOverrides.set(vendorId, updated);
    this.commit('vendor', 'reliability', vendorId, updated);
    return updated;
  }

  // --- per-agent consensus weights ---
  getAgentWeight(agent: string, seed = 1): number {
    return this.agentWeights.get(agent) ?? seed;
  }

  updateAgentWeight(agent: string, success: boolean, alpha = 0.15): number {
    const current = this.getAgentWeight(agent);
    const updated = clamp((1 - alpha) * current + alpha * (success ? 1 : 0), 0.05, 1);
    this.agentWeights.set(agent, updated);
    this.commit(agent, 'agent_weight', agent, updated);
    return updated;
  }

  // --- budget ledger ---
  getSpent(propertyId: string): number {
    return this.budgetSpent.get(propertyId) ?? 0;
  }

  recordSpend(propertyId: string, amount: number): void {
    const total = this.getSpent(propertyId) + amount;
    this.budgetSpent.set(propertyId, total);
    this.commit('finance', 'spend', propertyId, total);
  }

  resetBudget(propertyId: string): void {
    this.budgetSpent.delete(propertyId);
  }

  // --- decision log ---
  recordDecision(decision: ReplenishmentDecision): void {
    this.lastDecisions.set(decision.itemId, decision);
    this.commit('orchestrator', 'decision', decision.itemId, `${decision.mode}:${decision.recommendedQty}`);
  }

  getDecision(itemId: string): ReplenishmentDecision | undefined {
    return this.lastDecisions.get(itemId);
  }

  /** Record an authorized priority-signal override for audit (patent §4.6). */
  recordOverride(key: string, value: number | string): void {
    this.commit('operator', 'override', key, value);
  }

  // --- query interface & agent-specific views ---
  query(filter: { agent?: string; kind?: MemoryVersionEntry['kind']; key?: string; sinceVersion?: number } = {}): MemoryVersionEntry[] {
    return this.log.filter(
      (entry) =>
        (filter.agent ? entry.agent === filter.agent : true) &&
        (filter.kind ? entry.kind === filter.kind : true) &&
        (filter.key ? entry.key === filter.key : true) &&
        (filter.sinceVersion !== undefined ? entry.version > filter.sinceVersion : true)
    );
  }

  /** A contextual view scoped to what a given agent needs from the store. */
  view(agent: string): { agent: string; version: number; beta: number; weight: number; recent: MemoryVersionEntry[] } {
    return {
      agent,
      version: this.currentVersion,
      beta: this.beta,
      weight: this.getAgentWeight(agent),
      recent: this.query({ agent }).slice(-10)
    };
  }

  // --- persistence across sessions ---
  snapshot(): MemorySnapshot {
    return {
      version: this.currentVersion,
      beta: this.beta,
      reliability: Object.fromEntries(this.reliabilityOverrides),
      spend: Object.fromEntries(this.budgetSpent),
      agentWeights: Object.fromEntries(this.agentWeights),
      log: [...this.log]
    };
  }

  restore(snapshot: MemorySnapshot): void {
    this.currentVersion = snapshot.version;
    this.beta = snapshot.beta;
    this.reliabilityOverrides.clear();
    this.budgetSpent.clear();
    this.agentWeights.clear();
    this.log.length = 0;
    for (const [k, v] of Object.entries(snapshot.reliability)) this.reliabilityOverrides.set(k, v);
    for (const [k, v] of Object.entries(snapshot.spend)) this.budgetSpent.set(k, v);
    for (const [k, v] of Object.entries(snapshot.agentWeights)) this.agentWeights.set(k, v);
    this.log.push(...snapshot.log);
  }
}
