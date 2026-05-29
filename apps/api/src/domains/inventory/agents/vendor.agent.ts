import type { VendorOption, VendorScore } from '../contracts';
import type { SharedMemory } from '../memory';
import { argmax, minMaxNormalize, normalizedEntropy, softmax } from '../math';

// Utility weights: cost matters most, then reliability, then speed.
const W_PRICE = 0.4;
const W_RELIABILITY = 0.35;
const W_LEAD = 0.25;

export interface VendorSelection {
  selected: VendorOption | null;
  scores: VendorScore[];
  confidence: number;
  entropy: number;
}

/**
 * Vendor Agent (patent §4.3, §4.5, claims 3/8/15).
 *
 * Scores each candidate vendor on a multi-variable utility (normalised price,
 * lead time, and RL-adjusted reliability), converts utilities to a probability
 * distribution via the Boltzmann/softmax rule exp(beta * U(a)), and selects the
 * highest-probability vendor. The distribution's peak gives a confidence score
 * and its normalised entropy quantifies selection uncertainty for the consensus
 * protocol.
 */
export class VendorAgent {
  constructor(private readonly beta = 6) {}

  select(candidates: VendorOption[], memory: SharedMemory): VendorSelection {
    if (candidates.length === 0) {
      return { selected: null, scores: [], confidence: 0, entropy: 0 };
    }

    const reliabilities = candidates.map((vendor) => memory.getReliability(vendor.id, vendor.reliability));
    const priceNorm = minMaxNormalize(candidates.map((v) => v.unitPrice));
    const leadNorm = minMaxNormalize(candidates.map((v) => v.leadTimeDays));

    const utilities = candidates.map((_, i) => {
      const cheapness = 1 - (priceNorm[i] ?? 0.5);
      const speed = 1 - (leadNorm[i] ?? 0.5);
      const reliability = reliabilities[i] ?? 0.5;
      return W_PRICE * cheapness + W_LEAD * speed + W_RELIABILITY * reliability;
    });

    const probabilities = softmax(utilities, this.beta);
    const winner = argmax(probabilities);

    const scores: VendorScore[] = candidates.map((vendor, i) => ({
      vendorId: vendor.id,
      vendorName: vendor.name,
      utility: utilities[i] ?? 0,
      probability: probabilities[i] ?? 0
    }));

    return {
      selected: candidates[winner] ?? null,
      scores,
      confidence: probabilities[winner] ?? 0,
      entropy: normalizedEntropy(probabilities)
    };
  }
}
