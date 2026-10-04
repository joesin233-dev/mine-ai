// Tarpec AI — Diagnostic Engine: shared statistics helpers
// Small pure functions reused by the contributor scorer. Missing values
// (NaN) are skipped, never treated as numbers.

const isNum = (v: number): boolean => Number.isFinite(v);

export function average(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function pearsonCorrelation(x: number[], y: number[]): number | null {
  const n = Math.min(x.length, y.length);
  const xs: number[] = [];
  const ys: number[] = [];
  for (let i = 0; i < n; i++) {
    if (isNum(x[i]) && isNum(y[i])) {
      xs.push(x[i]);
      ys.push(y[i]);
    }
  }
  if (xs.length < 2) return null;

  const xMean = average(xs);
  const yMean = average(ys);

  let numerator = 0;
  let sumXSq = 0;
  let sumYSq = 0;

  for (let i = 0; i < xs.length; i++) {
    const dx = xs[i] - xMean;
    const dy = ys[i] - yMean;
    numerator += dx * dy;
    sumXSq += dx * dx;
    sumYSq += dy * dy;
  }

  const denominator = Math.sqrt(sumXSq * sumYSq);
  if (denominator === 0) return null;

  return numerator / denominator;
}

/**
 * Fraction of paired points where x and y moved in the SAME direction
 * from one row to the next. (Kept for existing callers.)
 */
export function directionalConsistency(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 2) return 0;

  let agree = 0;
  let total = 0;

  for (let i = 1; i < n; i++) {
    const dx = x[i] - x[i - 1];
    const dy = y[i] - y[i - 1];
    if (!isNum(dx) || !isNum(dy) || dx === 0 || dy === 0) continue;
    total++;
    if (Math.sign(dx) === Math.sign(dy)) agree++;
  }

  if (total === 0) return 0;
  return agree / total;
}

/**
 * How reliably x and y move together row to row, in EITHER direction.
 * 1 = always moves together (or always opposite), 0.5 = no pattern.
 */
export function signAwareConsistency(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 2) return 0;

  let same = 0;
  let total = 0;

  for (let i = 1; i < n; i++) {
    const dx = x[i] - x[i - 1];
    const dy = y[i] - y[i - 1];
    if (!isNum(dx) || !isNum(dy) || dx === 0 || dy === 0) continue;
    total++;
    if (Math.sign(dx) === Math.sign(dy)) same++;
  }

  if (total === 0) return 0;
  const sameFraction = same / total;
  return Math.max(sameFraction, 1 - sameFraction);
}
