// MINE AI V0.1 — Diagnostic Engine: shared statistics helpers
// Small pure functions reused by the contributor scorer. Kept separate so
// the scoring logic itself stays readable.

export function average(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function pearsonCorrelation(x: number[], y: number[]): number | null {
  const n = Math.min(x.length, y.length);
  if (n === 0) return null;

  const xMean = average(x.slice(0, n));
  const yMean = average(y.slice(0, n));

  let numerator = 0;
  let sumXSq = 0;
  let sumYSq = 0;

  for (let i = 0; i < n; i++) {
    const dx = x[i] - xMean;
    const dy = y[i] - yMean;
    numerator += dx * dy;
    sumXSq += dx * dx;
    sumYSq += dy * dy;
  }

  const denominator = Math.sqrt(sumXSq * sumYSq);
  if (denominator === 0) return null;

  return numerator / denominator;
}

/**
 * Fraction of paired points where x and y moved in the same direction
 * from one row to the next. Used as a simple consistency signal —
 * high consistency means the candidate reliably moves with the target,
 * not just on average.
 */
export function directionalConsistency(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 2) return 0;

  let agree = 0;
  let total = 0;

  for (let i = 1; i < n; i++) {
    const dx = x[i] - x[i - 1];
    const dy = y[i] - y[i - 1];
    if (dx === 0 || dy === 0) continue;
    total++;
    if (Math.sign(dx) === Math.sign(dy)) agree++;
  }

  if (total === 0) return 0;
  return agree / total;
}
