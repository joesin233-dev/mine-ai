// Tarpec AI — Economic Engine: Formula Engine
// Stage 8: performs the actual economic calculation. Every value here is
// either directly observed in the data or explicitly supplied by the user —
// nothing is invented. The formula used is always recorded alongside the
// result, per the "must record inputs, formula, result" rule.
//
// Two cases:
//   - a QUANTITY column (kg, tons, units): the change is multiplied by the
//     value per unit the user supplies;
//   - a MONEY column (already in the file's currency): the change IS the
//     impact, so nothing is multiplied.

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

  const formula = `${quantityChange.variableName} total change (${quantityChange.totalChange.toFixed(2)} units, across ${quantityChange.comparisonRowCount} rows) × value per unit (${valuePerUnit})`;

  return { formula, result };
}

export function calculateMoneyImpact(
  moneyChange: QuantityChange
): FormulaResult {
  const result = moneyChange.totalChange;

  const formula = `${moneyChange.variableName}: the recent average minus the earlier average, added up over ${moneyChange.comparisonRowCount} rows = ${moneyChange.totalChange.toFixed(2)}. This column is already money in the file's own currency, so no value per unit is needed.`;

  return { formula, result };
}
