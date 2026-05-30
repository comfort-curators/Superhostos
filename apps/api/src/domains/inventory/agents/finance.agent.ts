import { round2 } from "../math";

export interface FinanceVerdict {
  approvedQty: number;
  cost: number;
  withinBudget: boolean;
  notes: string[];
}

/**
 * Finance Agent (patent §4.3, §4.8).
 *
 * Enforces the per-cycle budget as a hard constraint. If the full recommended
 * order exceeds the remaining budget, it reduces the quantity to the largest
 * affordable amount rather than rejecting outright; if nothing is affordable the
 * order is blocked.
 */
export class FinanceAgent {
  evaluate(
    recommendedQty: number,
    unitPrice: number,
    budgetRemaining: number,
  ): FinanceVerdict {
    const notes: string[] = [];
    const fullCost = round2(recommendedQty * unitPrice);

    if (recommendedQty <= 0) {
      return { approvedQty: 0, cost: 0, withinBudget: true, notes };
    }

    if (fullCost <= budgetRemaining) {
      return {
        approvedQty: recommendedQty,
        cost: fullCost,
        withinBudget: true,
        notes,
      };
    }

    const affordableQty = Math.floor(budgetRemaining / unitPrice);
    if (affordableQty <= 0) {
      notes.push(
        `Budget exhausted: need ${fullCost.toFixed(2)}, ${budgetRemaining.toFixed(2)} remaining`,
      );
      return { approvedQty: 0, cost: 0, withinBudget: false, notes };
    }

    notes.push(
      `Quantity reduced ${recommendedQty} -> ${affordableQty} to fit remaining budget`,
    );
    return {
      approvedQty: affordableQty,
      cost: round2(affordableQty * unitPrice),
      withinBudget: false,
      notes,
    };
  }
}
