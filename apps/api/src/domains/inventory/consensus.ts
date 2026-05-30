import { argmax, normalizedEntropy } from "./math";

export interface AgentOpinion {
  agent: string;
  weight: number;
  distribution: number[];
}

export interface ConsensusResult {
  distribution: number[];
  chosenIndex: number;
  confidence: number;
  entropy: number;
  highUncertainty: boolean;
  contributors: Array<{ agent: string; weight: number }>;
}

/**
 * Multi-agent consensus protocol (patent §4.4, claims 3/7).
 *
 * Reconciles several agents' independent probability distributions over a shared
 * set of candidates into one decision. Opinions are combined by reliability-
 * weighted aggregation; the aggregate's normalised Shannon entropy quantifies
 * residual disagreement. The selected candidate is the entropy-minimising choice
 * (the argmax of the aggregated distribution — the peak that the weighted
 * agreement concentrates probability on). When entropy remains above the
 * threshold the result is flagged so callers can apply a conservative safety
 * buffer.
 */
export function aggregateConsensus(
  opinions: AgentOpinion[],
  entropyThreshold: number,
): ConsensusResult {
  const usable = opinions.filter(
    (o) => o.weight > 0 && o.distribution.length > 0,
  );
  if (usable.length === 0) {
    return {
      distribution: [],
      chosenIndex: -1,
      confidence: 0,
      entropy: 0,
      highUncertainty: true,
      contributors: [],
    };
  }

  const n = usable[0]?.distribution.length ?? 0;
  const totalWeight = usable.reduce((acc, o) => acc + o.weight, 0);

  const aggregated = new Array<number>(n).fill(0);
  for (const opinion of usable) {
    for (let i = 0; i < n; i += 1) {
      aggregated[i] =
        (aggregated[i] ?? 0) +
        (opinion.weight / totalWeight) * (opinion.distribution[i] ?? 0);
    }
  }

  // Renormalise to guard against rounding drift, then evaluate.
  const sum = aggregated.reduce((acc, p) => acc + p, 0) || 1;
  const distribution = aggregated.map((p) => p / sum);
  const chosenIndex = argmax(distribution);
  const entropy = normalizedEntropy(distribution);

  return {
    distribution,
    chosenIndex,
    confidence: distribution[chosenIndex] ?? 0,
    entropy,
    highUncertainty: entropy > entropyThreshold,
    contributors: usable.map((o) => ({ agent: o.agent, weight: o.weight })),
  };
}
