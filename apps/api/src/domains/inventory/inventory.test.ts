import { describe, expect, it } from 'vitest';
import { BookingAgent } from './agents/booking.agent';
import { FinanceAgent } from './agents/finance.agent';
import { InventoryAgent } from './agents/inventory.agent';
import { VendorAgent } from './agents/vendor.agent';
import type { VendorOption } from './contracts';
import { argmax, minMaxNormalize, normalizedEntropy, softmax } from './math';
import { SharedMemory } from './memory';
import { InventoryOrchestrator } from './orchestrator';
import { InventoryRepository } from './repository';
import { InventoryService } from './service';

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

describe('InventoryOrchestrator consensus / fallback', () => {
  const flatVendorAgents = () => ({
    booking: new BookingAgent(),
    inventory: new InventoryAgent(),
    vendor: new VendorAgent(0), // uniform softmax
    finance: new FinanceAgent()
  });

  it('falls back to the most reliable vendor when confidence is low (3 vendors, flat softmax)', () => {
    const repo = new InventoryRepository();
    const orch = new InventoryOrchestrator(repo, new SharedMemory(), flatVendorAgents());
    const towels = repo.listItems(PROPERTY_2).find((i) => i.sku === 'TWL-BATH')!;
    const decision = orch.decide(towels, 14, 10_000, NOW);
    expect(decision.mode).toBe('fallback'); // confidence 1/3 < floor
    expect(decision.selectedVendorId).not.toBeNull();
  });

  it('adds a safety buffer on high-entropy two-vendor selection', () => {
    const repo = new InventoryRepository();
    const orch = new InventoryOrchestrator(repo, new SharedMemory(), flatVendorAgents());
    const tp = repo.listItems(PROPERTY_2).find((i) => i.sku === 'TP-ROLL')!;
    const decision = orch.decide(tp, 14, 10_000, NOW);
    expect(decision.mode).toBe('consensus_buffered'); // confidence 0.5, entropy 1.0
  });

  it('skips items already above par + forecast', () => {
    const repo = new InventoryRepository();
    const orch = new InventoryOrchestrator(repo, new SharedMemory());
    const soap = repo.listItems('00000000-0000-0000-0000-000000000001').find((i) => i.sku === 'SOAP-BAR')!;
    const decision = orch.decide(soap, 1, 10_000, NOW);
    expect(decision.mode).toBe('skipped');
    expect(decision.recommendedQty).toBe(0);
  });
});

describe('InventoryService', () => {
  it('produces a budget-constrained plan', () => {
    const service = new InventoryService();
    const plan = service.plan(PROPERTY_2, 14, NOW);
    expect(plan.decisions.length).toBeGreaterThan(0);
    expect(plan.budgetRemaining).toBeLessThanOrEqual(plan.budget);
    expect(plan.decisions.some((d) => d.recommendedQty > 0)).toBe(true);
  });

  it('penalises reliability and skips stock on delivery failure', () => {
    const repo = new InventoryRepository();
    const memory = new SharedMemory();
    const service = new InventoryService(repo, memory);
    const before = repo.listItems(PROPERTY_2).map((i) => ({ id: i.id, onHand: i.onHand }));

    const results = service.execute(PROPERTY_2, 14, 'failure', NOW);
    expect(results.length).toBeGreaterThan(0);
    for (const r of results) {
      expect(r.outcome).toBe('failure');
      expect(r.orderedQty).toBe(0);
      expect(r.vendorReliabilityAfter).not.toBeNull();
    }
    const after = repo.listItems(PROPERTY_2).map((i) => ({ id: i.id, onHand: i.onHand }));
    expect(after).toEqual(before); // failed deliveries don't change stock
  });

  it('commits stock and spend on success', () => {
    const repo = new InventoryRepository();
    const memory = new SharedMemory();
    const service = new InventoryService(repo, memory);
    const before = new Map(repo.listItems(PROPERTY_2).map((i) => [i.id, i.onHand]));

    const results = service.execute(PROPERTY_2, 14, 'success', NOW);
    expect(results.every((r) => r.outcome === 'success')).toBe(true);
    expect(results.some((r) => r.orderedQty > 0)).toBe(true);

    // At least one item was restocked, and the budget ledger recorded spend.
    const restocked = repo.listItems(PROPERTY_2).some((i) => i.onHand > (before.get(i.id) ?? 0));
    expect(restocked).toBe(true);
    expect(memory.getSpent(PROPERTY_2)).toBeGreaterThan(0);
  });
});
