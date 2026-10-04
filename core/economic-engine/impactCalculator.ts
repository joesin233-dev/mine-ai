// Tarpec AI — Economic Engine: Impact Calculator
// Stage 8: the full pipeline — a Finding + user inputs in, an EconomicResult
// out. Derives the actual change from the real data (same baseline/
// comparison split used elsewhere), then:
//   - if the column is already MONEY (its name carries a currency tag such
//     as "(NGN)"), the change is the impact and no value per unit is asked;
//   - otherwise it is a quantity, and the formula engine multiplies by the
//     value per unit, only if that input is present.
// Empty cells and text are skipped instead of being counted as 0.

import type { Dataset, Finding, EconomicResult } from "@/models/types";
import { checkRequiredInputs } from "./inputManager";
import { calculateImpact, calculateMoneyImpact } from "./formulaEngine";
import { currencyTagInName } from "../data-engine/currencyTag";

export interface CalculateEconomicInput {
  finding: Finding;
  dataset: Dataset;
  rows: Record<string, string | number | null>[];
  providedInputs: Record<string, number>;
  currency?: string;
}

/** Empty cells and text become NaN (not 0), so they are skipped. */
function toNumber(value: string | number | null | undefined): number {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "") return Number(value);
  return NaN;
}

function deriveChange(
  finding: Finding,
  rows: Record<string, string | number | null>[]
) {
  const variableName = finding.variablesInvolved[0];
  const values = rows
    .map((row) => toNumber(row[variableName]))
    .filter((v) => Number.isFinite(v));

  const mid = Math.floor(values.length / 2);
  const baseline = values.slice(0, mid);
  const comparison = values.slice(mid);

  if (baseline.length === 0 || comparison.length === 0) return null;

  const baselineMean = average(baseline);
  const comparisonMean = average(comparison);
  const changePerRow = comparisonMean - baselineMean;
  const totalChange = changePerRow * comparison.length;

  return {
    variableName,
    totalChange,
    comparisonRowCount: comparison.length,
  };
}

function average(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function calculateEconomicImpact(input: CalculateEconomicInput): EconomicResult {
  const { finding, rows, providedInputs } = input;
  const fileCurrency = (input.currency ?? "").trim();
  const variableName = finding.variablesInvolved[0];
  const columnCurrency = currencyTagInName(variableName);
  const isMoneyColumn = columnCurrency !== undefined;
  // A money column's own tag wins over the file-wide currency.
  const currency = columnCurrency ?? fileCurrency;

  const notEnoughData = (): EconomicResult => ({
    findingId: finding.id,
    inputs: providedInputs,
    formula: "Not enough data was available to calculate a change.",
    result: null,
    currency,
    period: finding.period,
    valueType: "estimated",
    missingInputs: [],
  });

  // Money column: the change itself is the impact.
  if (isMoneyColumn) {
    const change = deriveChange(finding, rows);
    if (!change) return notEnoughData();

    const { formula, result } = calculateMoneyImpact(change);
    return {
      findingId: finding.id,
      inputs: {},
      formula,
      result,
      currency,
      period: finding.period,
      valueType: "calculated",
    };
  }

  // Quantity column: needs the value per unit from the user.
  const inputCheck = checkRequiredInputs(providedInputs);

  if (!inputCheck.isComplete) {
    return {
      findingId: finding.id,
      inputs: providedInputs,
      formula: "Economic impact cannot currently be calculated.",
      result: null,
      currency,
      period: finding.period,
      valueType: "estimated",
      missingInputs: inputCheck.missingInputs,
    };
  }

  const quantityChange = deriveChange(finding, rows);
  if (!quantityChange) return notEnoughData();

  const { formula, result } = calculateImpact(quantityChange, providedInputs.valuePerUnit);

  return {
    findingId: finding.id,
    inputs: providedInputs,
    formula,
    result,
    currency,
    period: finding.period,
    valueType: "calculated",
  };
}
