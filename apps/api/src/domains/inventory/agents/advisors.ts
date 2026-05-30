import type { VendorOption } from '../contracts';
import type { SharedMemory } from '../memory';
import { minMaxNormalize, softmax } from '../math';

// Utility weights for the optimizer's blended view.
const W_PRICE = 0.4;
const W_RELIABILITY = 0.35;
const W_LEAD = 0.25;

export interface VendorMetrics {
  cheapness: number[];
  speed: number[];
  reliability: number[];
}

/** Per-vendor normalised metrics shared by all advisor views. */
export function vendorMetrics(candidates: VendorOption[], memory: SharedMemory): VendorMetrics {
  const priceNorm = minMaxNormalize(candidates.map((v) => v.unitPrice));
  const leadNorm = minMaxNormalize(candidates.map((v) => v.leadTimeDays));
  return {
    cheapness: priceNorm.map((p) => 1 - p),
    speed: leadNorm.map((l) => 1 - l),
    reliability: candidates.map((v) => memory.getReliability(v.id, v.reliability))
  };
}

/**
 * Independent advisor opinions over the same candidate set. Each returns a
 * probability distribution via softmax(exp(beta * U)); the consensus protocol
 * later reconciles them. Modelling cost and reliability as separate "agents"
 * (rather than folding them into one utility) is what makes the downstream
 * aggregation a genuine multi-agent consensus.
 */
export function optimizerOpinion(candidates: VendorOption[], memory: SharedMemory, beta: number): number[] {
  const m = vendorMetrics(candidates, memory);
  const utilities = candidates.map(
    (_, i) => W_PRICE * (m.cheapness[i] ?? 0.5) + W_LEAD * (m.speed[i] ?? 0.5) + W_RELIABILITY * (m.reliability[i] ?? 0.5)
  );
  return softmax(utilities, beta);
}

export function costOpinion(candidates: VendorOption[], memory: SharedMemory, beta: number): number[] {
  return softmax(vendorMetrics(candidates, memory).cheapness, beta);
}

export function reliabilityOpinion(candidates: VendorOption[], memory: SharedMemory, beta: number): number[] {
  return softmax(vendorMetrics(candidates, memory).reliability, beta);
}
