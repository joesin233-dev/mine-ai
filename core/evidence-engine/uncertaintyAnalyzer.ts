// MINE AI V0.1 — Evidence Engine: Uncertainty Analyzer
// Stage 7: lists the honest limitations of this specific analysis — data
// scope, method limits, and what V0.1 genuinely cannot determine. This is
// distinct from "alternative explanations" (Stage 6) — limitations are
// about the analysis method itself, not about other possible causes.

export function analyzeUncertainty(rowCount: number, variablesUsedCount: number): string[] {
  const limitations: string[] = [
    "This analysis shows statistical association only. It does not and cannot confirm that any contributor caused the finding.",
    "MINE AI V0.1 uses deterministic statistics and rule-based scoring — it does not have contextual or domain knowledge about your operations beyond what is in this dataset.",
  ];

  if (rowCount < 20) {
    limitations.push(
      `The dataset contains ${rowCount} rows. Small samples can produce misleading correlations by chance — treat this finding as a starting point for investigation, not a final answer.`
    );
  }

  if (variablesUsedCount <= 1) {
    limitations.push(
      "Only one variable was available for comparison, so this analysis could not check for other contributing factors."
    );
  }

  limitations.push(
    "Human validation is recommended before acting on this finding — someone with operational context should review it."
  );

  return limitations;
}
