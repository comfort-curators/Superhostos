import {
  costOpinion,
  optimizerOpinion,
  reliabilityOpinion,
} from "./agents/advisors";
import { BookingAgent } from "./agents/booking.agent";
import { FinanceAgent } from "./agents/finance.agent";
import { InventoryAgent } from "./agents/inventory.agent";
import { aggregateConsensus } from "./consensus";
import type {
  InventoryItem,
  OverrideSignal,
  ReplenishmentDecision,
  VendorOption,
  VendorScore,
} from "./contracts";
import { argmax, round2 } from "./math";
import type { SharedMemory } from "./memory";
import type { InventoryRepository } from "./repository";

// Consensus thresholds (patent §4.4, §4.6).
const CONFIDENCE_FLOOR = 0.4; // below this -> deterministic fallback
const ENTROPY_HIGH = 0.8; // above this -> conservative safety buffer
const SAFETY_BUFFER_PCT = 0.15;

export interface AgentBundle {
  booking: BookingAgent;
  inventory: InventoryAgent;
  finance: FinanceAgent;
}

function defaultAgents(): AgentBundle {
  return {
    booking: new BookingAgent(),
    inventory: new InventoryAgent(),
    finance: new FinanceAgent(),
  };
}

/**
 * Orchestrator implementing the multi-agent consensus protocol and the
 * deterministic fallback mechanism. It sequences the agents over the shared
 * memory layer, reconciles three independent vendor opinions (optimizer, cost,
 * reliability) via entropy-minimising consensus, and turns an inventory item
 * into a single replenishment decision.
 */
export class InventoryOrchestrator {
  constructor(
    private readonly repository: InventoryRepository,
    private readonly memory: SharedMemory,
    private readonly agents: AgentBundle = defaultAgents(),
  ) {}

  async decide(
    item: InventoryItem,
    horizonDays: number,
    budgetRemaining: number,
    now: Date = new Date(),
    override?: OverrideSignal,
  ): Promise<ReplenishmentDecision> {
    const notes: string[] = [];
    const beta = this.memory.getBeta();
    const occupancyRate = this.agents.booking.occupancyRate(
      item.propertyId,
      horizonDays,
      now,
    );
    const forecast = this.agents.inventory.forecast(
      item,
      occupancyRate,
      horizonDays,
      now,
    );

    const base = {
      itemId: item.id,
      sku: item.sku,
      name: item.name,
      propertyId: item.propertyId,
      occupancyRate: round2(occupancyRate),
      forecastDemand: forecast.forecastDemand,
      safetyBuffer: forecast.safetyBuffer,
      onHand: item.onHand,
      betaUsed: round2(beta),
    };

    const skip = (
      mode: ReplenishmentDecision["mode"],
      skipNotes: string[],
    ): ReplenishmentDecision => {
      const decision: ReplenishmentDecision = {
        ...base,
        recommendedQty: 0,
        selectedVendorId: null,
        selectedVendorName: null,
        vendorScores: [],
        consensusContributors: [],
        confidence: mode === "skipped" ? 1 : 0,
        entropy: 0,
        estimatedCost: 0,
        withinBudget: true,
        mode,
        notes: skipNotes,
      };
      this.memory.recordDecision(decision);
      return decision;
    };

    if (forecast.recommendedQty <= 0)
      return skip("skipped", ["On-hand stock covers forecast + par level"]);

    const candidates = await this.repository.vendorsForSku(item.sku);
    if (candidates.length === 0)
      return skip("fallback", [`No vendor can fulfil SKU ${item.sku}`]);

    // --- multi-agent consensus over the vendor candidates ---
    const consensus = aggregateConsensus(
      [
        {
          agent: "vendor",
          weight: this.memory.getAgentWeight("vendor"),
          distribution: optimizerOpinion(candidates, this.memory, beta),
        },
        {
          agent: "finance",
          weight: this.memory.getAgentWeight("finance"),
          distribution: costOpinion(candidates, this.memory, beta),
        },
        {
          agent: "reliability",
          weight: this.memory.getAgentWeight("reliability"),
          distribution: reliabilityOpinion(candidates, this.memory, beta),
        },
      ],
      ENTROPY_HIGH,
    );

    const vendorScores: VendorScore[] = candidates.map((vendor, i) => ({
      vendorId: vendor.id,
      vendorName: vendor.name,
      utility: round2(consensus.distribution[i] ?? 0),
      probability: round2(consensus.distribution[i] ?? 0),
    }));

    let qty = forecast.recommendedQty;
    let chosen: VendorOption =
      candidates[consensus.chosenIndex] ?? this.mostReliable(candidates);
    let mode: ReplenishmentDecision["mode"] = "optimized";

    // Authorized priority override takes precedence over the optimizer.
    const forced =
      override?.authorized && override.forceVendorId
        ? candidates.find((v) => v.id === override.forceVendorId)
        : undefined;
    if (forced) {
      chosen = forced;
      notes.push(`Priority override -> vendor ${forced.name}`);
      this.memory.recordOverride("forceVendor", forced.id);
    } else if (consensus.confidence < CONFIDENCE_FLOOR) {
      chosen = this.mostReliable(candidates);
      mode = "fallback";
      notes.push(
        `Low consensus confidence (${consensus.confidence.toFixed(2)}) -> deterministic most-reliable vendor`,
      );
    } else if (consensus.highUncertainty) {
      qty = Math.ceil(qty * (1 + SAFETY_BUFFER_PCT));
      mode = "consensus_buffered";
      notes.push(
        `High consensus entropy (${consensus.entropy.toFixed(2)}) -> +${Math.round(SAFETY_BUFFER_PCT * 100)}% safety buffer`,
      );
    }

    const verdict = this.agents.finance.evaluate(
      qty,
      chosen.unitPrice,
      budgetRemaining,
    );
    notes.push(...verdict.notes);

    const placed = verdict.approvedQty > 0;
    const decision: ReplenishmentDecision = {
      ...base,
      recommendedQty: verdict.approvedQty,
      selectedVendorId: placed ? chosen.id : null,
      selectedVendorName: placed ? chosen.name : null,
      vendorScores,
      consensusContributors: consensus.contributors,
      confidence: round2(consensus.confidence),
      entropy: round2(consensus.entropy),
      estimatedCost: verdict.cost,
      withinBudget: verdict.withinBudget,
      mode,
      notes,
    };
    this.memory.recordDecision(decision);
    return decision;
  }

  private mostReliable(candidates: VendorOption[]): VendorOption {
    const reliabilities = candidates.map((v) =>
      this.memory.getReliability(v.id, v.reliability),
    );
    return candidates[argmax(reliabilities)] ?? (candidates[0] as VendorOption);
  }
}
