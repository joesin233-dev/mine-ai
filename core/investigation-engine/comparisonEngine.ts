// MINE AI V0.1 — Investigation Engine: Comparison Engine
// Stage 5: computes the actual before/after (or period-vs-rest) comparison
// for a selected variable. This is the deterministic calculation step —
// no AI involved, just arithmetic on the real numbers.

export interface ComparisonResult {
  baselineMean: number;
  comparisonMean: number;
  percentChange: number;
  baselineCount: number;
  comparisonCount: number;
}

export function compareGroups(
  baselineValues: number[],
  comparisonValues: number[]
): ComparisonResult | null {
  if (baselineValues.length === 0 || comparisonValues.length === 0) {
    return null;
  }

  const baselineMean = average(baselineValues);
  const comparisonMean = average(comparisonValues);

  if (baselineMean === 0) return null;

  const percentChange = ((comparisonMean - baselineMean) / baselineMean) * 100;

  return {
    baselineMean,
    comparisonMean,
    percentChange,
    baselineCount: baselineValues.length,
    comparisonCount: comparisonValues.length,
  };
}

function average(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}
