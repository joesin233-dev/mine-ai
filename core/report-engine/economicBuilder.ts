// MINE AI V0.1 — Report Engine: Economic Builder
// Stage 10: turns an EconomicResult (or its absence) into a plain-language
// summary for the report. Never invents a number — if the impact wasn't
// calculated, it says so plainly.

import type { EconomicResult } from "@/models/types";

export function buildEconomicSummary(economicImpact: EconomicResult | null): string {
  if (!economicImpact) {
    return "Economic impact has not been calculated for this finding yet.";
  }

  if (economicImpact.result === null) {
    return `Economic impact cannot currently be calculated. Missing information: ${economicImpact.missingInputs?.join(", ") ?? "unknown"}.`;
  }

  return `Estimated economic impact: ${economicImpact.currency} ${economicImpact.result.toLocaleString(undefined, { maximumFractionDigits: 2 })} (${economicImpact.valueType}). Formula: ${economicImpact.formula}`;
}
