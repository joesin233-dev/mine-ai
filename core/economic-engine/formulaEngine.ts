// MINE AI V0.1 — Economic Engine: Formula Engine
// Stage 8: performs the actual economic calculation. Every value here is
// either directly observed in the data or explicitly supplied by the user —
// nothing is invented. The formula used is always recorded alongside the
// result, per the "must record inputs, formula, result" rule.

export interface QuantityChange {
  variableName: string;
  totalChange: number; // total units gained or lost across the comparison period
  comparisonRowCount: number;
}

export interface FormulaResult {
  formula: string;
  result: number;
}

export function calculateImpact(
  quantityChange: QuantityChange,
  valuePerUnit: number
): FormulaResult {
  const result = quantityChange.totalChange * valuePerUnit;

  const formula = `${quantityChange.variableName} total change (${quantityChange.totalChange.toFixed(2)} units, across ${quantityChange.comparisonRowCount} rows) × value per unit ($${valuePerUnit})`;

  return { formula, result };
}
