export function detectTrends(
  datasetId: string,
  columnName: string,
  values: number[],
  periodDates: string[]
): Finding[] {
  if (values.length < 4) return [];

  const n = values.length;
  const xValues = values.map((_, i) => i);

  const xMean = average(xValues);
  const yMean = average(values);

  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < n; i++) {
    numerator += (xValues[i] - xMean) * (values[i] - yMean);
    denominator += (xValues[i] - xMean) ** 2;
  }

  if (denominator === 0) return [];

  const slope = numerator / denominator;
  const intercept = yMean - slope * xMean;

  let ssRes = 0;
  let ssTot = 0;
  for (let i = 0; i < n; i++) {
    const predicted = slope * xValues[i] + intercept;
    ssRes += (values[i] - predicted) ** 2;
    ssTot += (values[i] - yMean) ** 2;
  }
  const rSquared = ssTot === 0 ? 0 : 1 - ssRes / ssTot;

  if (rSquared < MIN_R_SQUARED) return [];

  const fittedStart = slope * xValues[0] + intercept;
  const fittedEnd = slope * xValues[n - 1] + intercept;

  // Guard against a fragile near-zero baseline: use a stable reference
  // (the average magnitude of the actual data) instead of dividing by
  // whatever the fitted line happens to hit at the first point.
  const scale = average(values.map((v) => Math.abs(v)));
  if (scale === 0) return [];

  const baseline = Math.abs(fittedStart) > scale * 0.05 ? Math.abs(fittedStart) : scale;

  const percentChange = ((fittedEnd - fittedStart) / baseline) * 100;
  const direction = slope < 0 ? "declining" : "rising";

  const finding: Finding = {
    id: `trend-${columnName}-${datasetId}`,
    datasetId,
    type: "trend",
    variablesInvolved: [columnName],
    period: {
      start: periodDates[0] ?? "",
      end: periodDates[periodDates.length - 1] ?? "",
    },
    magnitude: Math.abs(percentChange),
    rankScore: 0,
    description: `${columnName} shows a ${direction} trend across the available period, changing by approximately ${Math.abs(percentChange).toFixed(1)}% (fit strength R²=${rSquared.toFixed(2)}).`,
  };

  return [finding];
}

function average(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}
