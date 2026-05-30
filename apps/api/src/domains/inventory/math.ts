// Numerical primitives shared by the predictive inventory agents.
//
// These implement the math referenced in the patent: the softmax/Boltzmann
// action-selection rule (exp(beta * U(a)) / sum_b exp(beta * U(b))), the
// Shannon entropy used by the consensus protocol, and small helpers for
// normalisation. Everything here is pure and deterministic so it can be unit
// tested directly.

/**
 * Boltzmann (softmax) distribution over utilities.
 *
 * Returns a probability for each utility proportional to exp(beta * U). The
 * `beta` sensitivity parameter sharpens the distribution as it grows (beta -> ∞
 * approaches argmax) and flattens it toward uniform as it shrinks toward 0.
 *
 * Utilities are mean-shifted before exponentiation for numerical stability;
 * this does not change the resulting probabilities.
 */
export function softmax(utilities: number[], beta = 1): number[] {
  if (utilities.length === 0) return [];
  if (!Number.isFinite(beta) || beta < 0)
    throw new Error("beta must be a non-negative finite number");

  const scaled = utilities.map((u) => beta * u);
  const max = Math.max(...scaled);
  const exps = scaled.map((s) => Math.exp(s - max));
  const sum = exps.reduce((acc, value) => acc + value, 0);
  // Guard against the degenerate all-equal / zero-sum case.
  if (sum === 0 || !Number.isFinite(sum))
    return utilities.map(() => 1 / utilities.length);
  return exps.map((value) => value / sum);
}

/** Shannon entropy (in nats) of a probability distribution. */
export function shannonEntropy(probabilities: number[]): number {
  return -probabilities.reduce(
    (acc, p) => (p > 0 ? acc + p * Math.log(p) : acc),
    0,
  );
}

/**
 * Entropy normalised to [0, 1] against the maximum entropy (uniform) for the
 * given number of outcomes. 0 means a confident single choice; 1 means maximal
 * uncertainty. Used by the consensus protocol to detect high-uncertainty events.
 */
export function normalizedEntropy(probabilities: number[]): number {
  const n = probabilities.length;
  if (n <= 1) return 0;
  return shannonEntropy(probabilities) / Math.log(n);
}

/** Index of the largest value, ties resolved to the first occurrence. */
export function argmax(values: number[]): number {
  let best = 0;
  for (let i = 1; i < values.length; i += 1) {
    if (
      (values[i] ?? Number.NEGATIVE_INFINITY) >
      (values[best] ?? Number.NEGATIVE_INFINITY)
    )
      best = i;
  }
  return best;
}

/**
 * Min-max normalise to [0, 1]. When every value is equal there is no spread, so
 * each is treated as neutral (0.5) to avoid divide-by-zero artefacts.
 */
export function minMaxNormalize(values: number[]): number[] {
  if (values.length === 0) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return values.map(() => 0.5);
  return values.map((value) => (value - min) / (max - min));
}

export function clamp(value: number, lower: number, upper: number): number {
  return Math.min(upper, Math.max(lower, value));
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
