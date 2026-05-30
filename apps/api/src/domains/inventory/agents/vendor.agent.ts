import type { VendorOption, VendorScore } from "../contracts";
import { argmax, normalizedEntropy } from "../math";
import type { SharedMemory } from "../memory";
import { optimizerOpinion } from "./advisors";

export interface VendorSelection {
  selected: VendorOption | null;
  scores: VendorScore[];
  confidence: number;
  entropy: number;
}

/**
 * Vendor Agent (patent §4.3, claims 3/8/15).
 *
 * Produces the optimizer's blended-utility opinion over candidate vendors and,
 * for standalone use, resolves it to a single selection with confidence and
 * entropy. In the full pipeline this opinion is one input to the multi-agent
 * consensus protocol (see `consensus.ts`).
 */
export class VendorAgent {
  constructor(private readonly beta = 6) {}

  select(candidates: VendorOption[], memory: SharedMemory): VendorSelection {
    if (candidates.length === 0) {
      return { selected: null, scores: [], confidence: 0, entropy: 0 };
    }

    const probabilities = optimizerOpinion(candidates, memory, this.beta);
    const winner = argmax(probabilities);
    const scores: VendorScore[] = candidates.map((vendor, i) => ({
      vendorId: vendor.id,
      vendorName: vendor.name,
      utility: probabilities[i] ?? 0,
      probability: probabilities[i] ?? 0,
    }));

    return {
      selected: candidates[winner] ?? null,
      scores,
      confidence: probabilities[winner] ?? 0,
      entropy: normalizedEntropy(probabilities),
    };
  }
}
