// MINE AI V0.1 — Economic Engine: Impact Calculator
// Stage 8: the full pipeline — a Finding + user inputs in, an EconomicResult
// out. Derives the actual quantity change from the real data (same
// baseline/comparison split used elsewhere), then applies the formula
// engine only if all required inputs are present.

import type { Dataset, Finding, EconomicResult } from "@/models/types";
import { checkRequiredInputs } from "./inputManager";
import { calculateImpact } from "./formulaEngine";

export interface CalculateEconomicInput {
  finding: Finding;
  dataset: Dataset;
  rows: Record<string, string | number | null>[];
  providedInputs: Record<string, number>;
  currency?: string;
}

function deriveQuantityChange(
  finding: Finding,
  rows: Record<string, string | number | null>[]
) {
  const variableName = finding.variablesInvolved[0];
  const values = rows
    .map((row) => Number(row[variableName]))
    .filter((v) => !Number.isNaN(v));

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
  const { finding, rows, providedInputs, currency = "USD" } = input;

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

  const quantityChange = deriveQuantityChange(finding, rows);

  if (!quantityChange) {
    return {
      findingId: finding.id,
      inputs: providedInputs,
      formula: "Not enough data was available to calculate a quantity change.",
      result: null,
      currency,
      period: finding.period,
      valueType: "estimated",
      missingInputs: [],
    };
  }

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
