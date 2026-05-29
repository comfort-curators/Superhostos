import type { InventoryItem } from '../contracts';
import { round2 } from '../math';

// Even an empty property consumes some stock (turnovers, cleaning, spoilage).
const USAGE_FLOOR = 0.25;
// Safety-stock z-score (~95% service level) applied to the demand std-dev.
const SERVICE_Z = 1.65;

export interface DemandForecast {
  occupancyRate: number;
  seasonalFactor: number;
  forecastDemand: number;
  safetyBuffer: number;
  recommendedQty: number;
}

/**
 * Northern-hemisphere hospitality seasonality: summer peak, winter trough.
 * A smooth cosine over the year keeps the factor in roughly [0.85, 1.15].
 */
export function seasonalFactor(now: Date): number {
  const month = now.getUTCMonth(); // 0 = Jan
  return round2(1 + 0.15 * Math.cos(((month - 6) / 12) * 2 * Math.PI) * -1);
}

/**
 * Inventory Agent (patent §4.3, §4.5).
 *
 * Combines the occupancy signal with historical base usage and a seasonal
 * adjustment to produce a time-series demand forecast over the horizon, then
 * adds a probabilistic safety buffer (Poisson-style sqrt variance) and recommends
 * a replenishment quantity that restores both the forecast-plus-buffer target
 * and the configured par level.
 */
export class InventoryAgent {
  forecast(item: InventoryItem, occupancyRate: number, horizonDays: number, now: Date = new Date()): DemandForecast {
    const season = seasonalFactor(now);
    const usageMultiplier = USAGE_FLOOR + occupancyRate;
    const forecastDemand = round2(item.baseDailyUsage * usageMultiplier * horizonDays * season);

    // Demand variance ~ forecast for count data; safety stock = z * sqrt(mean).
    const safetyBuffer = round2(SERVICE_Z * Math.sqrt(Math.max(forecastDemand, 0)));

    // Cover the forecast + buffer, but never let on-hand sit below par.
    const target = Math.max(forecastDemand + safetyBuffer, item.parLevel);
    const recommendedQty = Math.max(0, Math.ceil(target - item.onHand));

    return { occupancyRate, seasonalFactor: season, forecastDemand, safetyBuffer, recommendedQty };
  }
}
