import { describe, expect, it } from 'vitest';
import { FinanceAgent } from './agents/finance.agent';
import { InventoryAgent } from './agents/inventory.agent';
import { VendorAgent } from './agents/vendor.agent';
import { aggregateConsensus } from './consensus';
import type { VendorOption } from './contracts';
import { argmax, minMaxNormalize, normalizedEntropy, softmax } from './math';
import { DEFAULT_BETA, SharedMemory } from './memory';
import { InventoryOrchestrator } from './orchestrator';
import { InventoryRepository } from './repository';
import { InventoryService } from './service';

const flat = (memory: SharedMemory) => memory.updateBeta(-DEFAULT_BETA); // beta -> 0, uniform softmax

const PROPERTY_2 = '00000000-0000-0000-0000-000000000002';
const NOW = new Date('2026-05-29T00:00:00Z');

describe('math', () => {
  it('softmax produces a normalised distribution', () => {
    const p = softmax([1, 2, 3], 1);
    expect(p.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10);
    expect(p[2]).toBeGreaterThan(p[0] as number);
  });

  it('higher beta sharpens the distribution', () => {
    const flat = softmax([1, 2, 3], 0.5);
    const sharp = softmax([1, 2, 3], 5);
    expect(Math.max(...sharp)).toBeGreaterThan(Math.max(...flat));
  });

  it('beta = 0 yields a uniform distribution', () => {
    expect(softmax([1, 5, 9], 0)).toEqual([1 / 3, 1 / 3, 1 / 3]);
  });

  it('normalized entropy spans [0,1]', () => {
    expect(normalizedEntropy([1 / 3, 1 / 3, 1 / 3])).toBeCloseTo(1, 10);
    expect(normalizedEntropy([1, 0, 0])).toBeCloseTo(0, 10);
  });

  it('minMaxNormalize handles a flat array', () => {
    expect(minMaxNormalize([5, 5, 5])).toEqual([0.5, 0.5, 0.5]);
    expect(argmax([3, 9, 4])).toBe(1);
  });
});

describe('InventoryAgent', () => {
  const agent = new InventoryAgent();
  const item = {
    id: 'i1',
    propertyId: PROPERTY_2,
    sku: 'X',
    name: 'X',
    category: 'linen' as const,
    unit: 'each',
    onHand: 0,
    parLevel: 0,
    baseDailyUsage: 2
  };

  it('forecast grows with occupancy', () => {
    const low = agent.forecast(item, 0.1, 14, NOW);
    const high = agent.forecast(item, 0.9, 14, NOW);
    expect(high.forecastDemand).toBeGreaterThan(low.forecastDemand);
    expect(high.recommendedQty).toBeGreaterThan(low.recommendedQty);
  });

  it('never recommends below the par level', () => {
    const f = agent.forecast({ ...item, parLevel: 100, onHand: 10 }, 0, 7, NOW);
    expect(f.recommendedQty).toBeGreaterThanOrEqual(90);
  });
});

describe('VendorAgent', () => {
  const memory = new SharedMemory();
  const vendors: VendorOption[] = [
    { id: 'v-cheap-reliable', name: 'A', skus: ['X'], unitPrice: 2, leadTimeDays: 1, reliability: 0.95 },
    { id: 'v-pricey-flaky', name: 'B', skus: ['X'], unitPrice: 9, leadTimeDays: 9, reliability: 0.5 }
  ];

  it('prefers the dominant vendor and reports confidence/entropy', () => {
    const result = new VendorAgent(6).select(vendors, memory);
    expect(result.selected?.id).toBe('v-cheap-reliable');
    expect(result.confidence).toBeGreaterThan(0.5);
    expect(result.entropy).toBeGreaterThanOrEqual(0);
    expect(result.scores.reduce((a, s) => a + s.probability, 0)).toBeCloseTo(1, 10);
  });

  it('handles an empty candidate set', () => {
    const result = new VendorAgent().select([], memory);
    expect(result.selected).toBeNull();
  });
});

describe('FinanceAgent', () => {
  const agent = new FinanceAgent();

  it('approves orders within budget', () => {
    expect(agent.evaluate(10, 5, 100)).toMatchObject({ approvedQty: 10, cost: 50, withinBudget: true });
  });

  it('reduces quantity to fit a tight budget', () => {
    const v = agent.evaluate(10, 5, 22);
    expect(v.approvedQty).toBe(4);
    expect(v.withinBudget).toBe(false);
  });

  it('blocks when nothing is affordable', () => {
    expect(agent.evaluate(10, 5, 2)).toMatchObject({ approvedQty: 0, withinBudget: false });
  });
});

describe('aggregateConsensus', () => {
  it('reconciles agreeing opinions into a confident choice', () => {
    const result = aggregateConsensus(
      [
        { agent: 'a', weight: 1, distribution: [0.9, 0.1] },
        { agent: 'b', weight: 1, distribution: [0.85, 0.15] }
      ],
      0.8
    );
    expect(result.chosenIndex).toBe(0);
    expect(result.confidence).toBeCloseTo(0.875, 5);
    expect(result.highUncertainty).toBe(false);
  });

  it('flags high uncertainty when opinions are uniform', () => {
    const result = aggregateConsensus(
      [
        { agent: 'a', weight: 1, distribution: [1 / 3, 1 / 3, 1 / 3] },
        { agent: 'b', weight: 1, distribution: [1 / 3, 1 / 3, 1 / 3] }
      ],
      0.8
    );
    expect(result.entropy).toBeCloseTo(1, 5);
    expect(result.highUncertainty).toBe(true);
  });

  it('weights a reliable agent more heavily', () => {
    const result = aggregateConsensus(
      [
        { agent: 'trusted', weight: 0.9, distribution: [0.9, 0.1] },
        { agent: 'flaky', weight: 0.1, distribution: [0.1, 0.9] }
      ],
      0.8
    );
    expect(result.chosenIndex).toBe(0);
  });
});

describe('InventoryOrchestrator consensus / fallback', () => {
  it('falls back to the most reliable vendor when consensus confidence is low (3 vendors)', async () => {
    const repo = new InventoryRepository();
    const memory = new SharedMemory();
    flat(memory); // uniform -> confidence 1/3 < floor
    const orch = new InventoryOrchestrator(repo, memory);
    const towels = (await repo.listItems(PROPERTY_2)).find((i) => i.sku === 'TWL-BATH')!;
    const decision = await orch.decide(towels, 14, 10_000, NOW);
    expect(decision.mode).toBe('fallback');
    expect(decision.selectedVendorId).not.toBeNull();
  });

  it('adds a safety buffer on high-entropy two-vendor consensus', async () => {
    const repo = new InventoryRepository();
    const memory = new SharedMemory();
    flat(memory); // 2 vendors uniform -> confidence 0.5, entropy 1.0
    const orch = new InventoryOrchestrator(repo, memory);
    const tp = (await repo.listItems(PROPERTY_2)).find((i) => i.sku === 'TP-ROLL')!;
    const decision = await orch.decide(tp, 14, 10_000, NOW);
    expect(decision.mode).toBe('consensus_buffered');
    expect(decision.consensusContributors.map((c) => c.agent).sort()).toEqual(['finance', 'reliability', 'vendor']);
  });

  it('honours an authorized priority override on vendor choice', async () => {
    const repo = new InventoryRepository();
    const orch = new InventoryOrchestrator(repo, new SharedMemory());
    const towels = (await repo.listItems(PROPERTY_2)).find((i) => i.sku === 'TWL-BATH')!;
    const forced = (await repo.vendorsForSku('TWL-BATH')).find((v) => v.name === 'RapidRestock')!;
    const decision = await orch.decide(towels, 14, 10_000, NOW, { authorized: true, forceVendorId: forced.id });
    expect(decision.selectedVendorId).toBe(forced.id);
    expect(decision.notes.join(' ')).toContain('Priority override');
  });

  it('ignores an unauthorized override', async () => {
    const repo = new InventoryRepository();
    const orch = new InventoryOrchestrator(repo, new SharedMemory());
    const towels = (await repo.listItems(PROPERTY_2)).find((i) => i.sku === 'TWL-BATH')!;
    const forced = (await repo.vendorsForSku('TWL-BATH')).find((v) => v.name === 'RapidRestock')!;
    const decision = await orch.decide(towels, 14, 10_000, NOW, { authorized: false, forceVendorId: forced.id });
    expect(decision.notes.join(' ')).not.toContain('Priority override');
  });

  it('skips items already above par + forecast', async () => {
    const repo = new InventoryRepository();
    const orch = new InventoryOrchestrator(repo, new SharedMemory());
    const soap = (await repo.listItems('00000000-0000-0000-0000-000000000001')).find((i) => i.sku === 'SOAP-BAR')!;
    const decision = await orch.decide(soap, 1, 10_000, NOW);
    expect(decision.mode).toBe('skipped');
    expect(decision.recommendedQty).toBe(0);
  });
});

describe('SharedMemory (versioned context layer)', () => {
  it('versions every mutation and exposes a queryable log', () => {
    const memory = new SharedMemory();
    expect(memory.version).toBe(0);
    memory.updateReliability('v1', 0.8, true);
    memory.recordSpend('p1', 50);
    expect(memory.version).toBe(2);
    expect(memory.query({ kind: 'reliability' })).toHaveLength(1);
    expect(memory.query({ agent: 'finance' })).toHaveLength(1);
  });

  it('snapshots and restores state across sessions', () => {
    const a = new SharedMemory();
    a.updateReliability('v1', 0.8, false);
    a.recordSpend('p1', 25);
    a.updateBeta(2);
    const snap = a.snapshot();

    const b = new SharedMemory();
    b.restore(snap);
    expect(b.version).toBe(a.version);
    expect(b.getSpent('p1')).toBe(25);
    expect(b.getReliability('v1', 0.8)).toBeCloseTo(a.getReliability('v1', 0.8), 10);
    expect(b.getBeta()).toBe(a.getBeta());
  });

  it('provides an agent-specific contextual view', () => {
    const memory = new SharedMemory();
    memory.updateAgentWeight('vendor', true);
    const view = memory.view('vendor');
    expect(view.agent).toBe('vendor');
    expect(view.recent.length).toBeGreaterThan(0);
  });
});

describe('InventoryService', () => {
  it('produces a budget-constrained plan', async () => {
    const service = new InventoryService();
    const plan = await service.plan(PROPERTY_2, 14, NOW);
    expect(plan.decisions.length).toBeGreaterThan(0);
    expect(plan.budgetRemaining).toBeLessThanOrEqual(plan.budget);
    expect(plan.decisions.some((d) => d.recommendedQty > 0)).toBe(true);
  });

  it('penalises reliability and skips stock on delivery failure', async () => {
    const repo = new InventoryRepository();
    const memory = new SharedMemory();
    const service = new InventoryService(repo, memory);
    const before = (await repo.listItems(PROPERTY_2)).map((i) => ({ id: i.id, onHand: i.onHand }));

    const results = await service.execute(PROPERTY_2, 14, 'failure', undefined, NOW);
    expect(results.length).toBeGreaterThan(0);
    for (const r of results) {
      expect(r.outcome).toBe('failure');
      expect(r.orderedQty).toBe(0);
      expect(r.vendorReliabilityAfter).not.toBeNull();
    }
    const after = (await repo.listItems(PROPERTY_2)).map((i) => ({ id: i.id, onHand: i.onHand }));
    expect(after).toEqual(before); // failed deliveries don't change stock
  });

  it('commits stock and spend on success', async () => {
    const repo = new InventoryRepository();
    const memory = new SharedMemory();
    const service = new InventoryService(repo, memory);
    const before = new Map((await repo.listItems(PROPERTY_2)).map((i) => [i.id, i.onHand]));

    const results = await service.execute(PROPERTY_2, 14, 'success', undefined, NOW);
    expect(results.every((r) => r.outcome === 'success')).toBe(true);
    expect(results.some((r) => r.orderedQty > 0)).toBe(true);

    // At least one item was restocked, and the budget ledger recorded spend.
    const restocked = (await repo.listItems(PROPERTY_2)).some((i) => i.onHand > (before.get(i.id) ?? 0));
    expect(restocked).toBe(true);
    expect(memory.getSpent(PROPERTY_2)).toBeGreaterThan(0);
  });

  it('adapts beta up on success and down on failure', async () => {
    const up = new InventoryService(new InventoryRepository(), new SharedMemory());
    const before = up.sharedMemory().getBeta();
    await up.execute(PROPERTY_2, 14, 'success', undefined, NOW);
    expect(up.sharedMemory().getBeta()).toBeGreaterThan(before);

    const down = new InventoryService(new InventoryRepository(), new SharedMemory());
    await down.execute(PROPERTY_2, 14, 'failure', undefined, NOW);
    expect(down.sharedMemory().getBeta()).toBeLessThan(before);
  });

  it('applies an authorized budget override', async () => {
    const service = new InventoryService(new InventoryRepository(), new SharedMemory());
    const plan = await service.plan(PROPERTY_2, 14, NOW, { authorized: true, budget: 1000 });
    expect(plan.budget).toBe(1000);
    expect(plan.memoryVersion).toBeGreaterThan(0);
  });
});
