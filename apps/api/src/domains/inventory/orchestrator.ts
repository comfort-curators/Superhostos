import { BookingAgent } from './agents/booking.agent';
import { FinanceAgent } from './agents/finance.agent';
import { InventoryAgent } from './agents/inventory.agent';
import { VendorAgent } from './agents/vendor.agent';
import type { InventoryItem, ReplenishmentDecision, VendorOption } from './contracts';
import { SharedMemory } from './memory';
import { argmax, round2 } from './math';
import type { InventoryRepository } from './repository';

// Consensus thresholds (patent §4.6, §4.9).
const CONFIDENCE_FLOOR = 0.4; // below this the optimizer is too unsure -> deterministic fallback
const ENTROPY_HIGH = 0.8; // above this selection is near-uniform -> conservative safety buffer
const SAFETY_BUFFER_PCT = 0.15;

export interface AgentBundle {
  booking: BookingAgent;
  inventory: InventoryAgent;
  vendor: VendorAgent;
  finance: FinanceAgent;
}

function defaultAgents(): AgentBundle {
  return { booking: new BookingAgent(), inventory: new InventoryAgent(), vendor: new VendorAgent(), finance: new FinanceAgent() };
}

/**
 * Orchestrator implementing the multi-agent consensus protocol and the
 * deterministic fallback mechanism. It sequences the agents over the shared
 * memory layer to turn an inventory item into a single replenishment decision.
 */
export class InventoryOrchestrator {
  constructor(
    private readonly repository: InventoryRepository,
    private readonly memory: SharedMemory,
    private readonly agents: AgentBundle = defaultAgents()
  ) {}

  /**
   * Produce a decision for one item. `budgetRemaining` is the budget left for
   * this property in the current cycle (threaded by the plan across items).
   */
  decide(item: InventoryItem, horizonDays: number, budgetRemaining: number, now: Date = new Date()): ReplenishmentDecision {
    const notes: string[] = [];
    const occupancyRate = this.agents.booking.occupancyRate(item.propertyId, horizonDays, now);
    const forecast = this.agents.inventory.forecast(item, occupancyRate, horizonDays, now);

    const base = {
      itemId: item.id,
      sku: item.sku,
      name: item.name,
      propertyId: item.propertyId,
      occupancyRate: round2(occupancyRate),
      forecastDemand: forecast.forecastDemand,
      safetyBuffer: forecast.safetyBuffer,
      onHand: item.onHand
    };

    // No deficit -> nothing to order.
    if (forecast.recommendedQty <= 0) {
      const decision: ReplenishmentDecision = {
        ...base,
        recommendedQty: 0,
        selectedVendorId: null,
        selectedVendorName: null,
        vendorScores: [],
        confidence: 1,
        entropy: 0,
        estimatedCost: 0,
        withinBudget: true,
        mode: 'skipped',
        notes: ['On-hand stock covers forecast + par level']
      };
      this.memory.recordDecision(decision);
      return decision;
    }

    const candidates = this.repository.vendorsForSku(item.sku);
    const selection = this.agents.vendor.select(candidates, this.memory);

    // No vendor can fulfil this SKU at all.
    if (!selection.selected) {
      const decision: ReplenishmentDecision = {
        ...base,
        recommendedQty: 0,
        selectedVendorId: null,
        selectedVendorName: null,
        vendorScores: [],
        confidence: 0,
        entropy: 0,
        estimatedCost: 0,
        withinBudget: true,
        mode: 'fallback',
        notes: [`No vendor can fulfil SKU ${item.sku}`]
      };
      this.memory.recordDecision(decision);
      return decision;
    }

    let qty = forecast.recommendedQty;
    let chosen: VendorOption = selection.selected;
    let mode: ReplenishmentDecision['mode'] = 'optimized';

    if (selection.confidence < CONFIDENCE_FLOOR) {
      // Deterministic fallback: ignore the flat softmax and take the most
      // reliable cached vendor (last-known-good behaviour).
      chosen = this.mostReliable(candidates);
      mode = 'fallback';
      notes.push(`Low optimizer confidence (${selection.confidence.toFixed(2)}) -> deterministic most-reliable vendor`);
    } else if (selection.entropy > ENTROPY_HIGH) {
      // High-uncertainty event: keep the optimizer's pick but order conservatively.
      qty = Math.ceil(qty * (1 + SAFETY_BUFFER_PCT));
      mode = 'consensus_buffered';
      notes.push(`High selection entropy (${selection.entropy.toFixed(2)}) -> +${Math.round(SAFETY_BUFFER_PCT * 100)}% safety buffer`);
    }

    const verdict = this.agents.finance.evaluate(qty, chosen.unitPrice, budgetRemaining);
    notes.push(...verdict.notes);

    const placed = verdict.approvedQty > 0;
    const decision: ReplenishmentDecision = {
      ...base,
      recommendedQty: verdict.approvedQty,
      selectedVendorId: placed ? chosen.id : null,
      selectedVendorName: placed ? chosen.name : null,
      vendorScores: selection.scores,
      confidence: round2(selection.confidence),
      entropy: round2(selection.entropy),
      estimatedCost: verdict.cost,
      withinBudget: verdict.withinBudget,
      mode,
      notes
    };
    this.memory.recordDecision(decision);
    return decision;
  }

  private mostReliable(candidates: VendorOption[]): VendorOption {
    const reliabilities = candidates.map((v) => this.memory.getReliability(v.id, v.reliability));
    const best = candidates[argmax(reliabilities)];
    // candidates is non-empty at every call site.
    return best ?? (candidates[0] as VendorOption);
  }
}
