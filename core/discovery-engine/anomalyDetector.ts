// MINE AI V0.1 — Discovery Engine: Anomaly Detector
// Stage 4: flags data points that sit unusually far from the rest of the
// column's values, using a standard z-score. Repeated occurrences of the
// same (or very close) unusual value are grouped into a single finding,
// so a recurring pattern doesn't flood the results with near-duplicates.

import type { Finding } from "@/models/types";

const Z_SCORE_THRESHOLD = 2; // points beyond 2 standard deviations are flagged
const MAX_DATES_LISTED = 5; // cap how many example dates appear in the text

export function detectAnomalies(
  datasetId: string,
  columnName: string,
  values: number[],
  rowDates: string[]
): Finding[] {
  if (values.length < 4) return []; // too few points for a meaningful stddev

  const mean = average(values);
  const stdDev = standardDeviation(values, mean);

  if (stdDev === 0) return []; // no variation, nothing to flag

  const anomalies: { value: number; date: string; zScore: number }[] = [];
  values.forEach((value, index) => {
    const zScore = (value - mean) / stdDev;
    if (Math.abs(zScore) >= Z_SCORE_THRESHOLD) {
      anomalies.push({ value, date: rowDates[index] ?? "an unknown date", zScore });
    }
  });

  if (anomalies.length === 0) return [];

  const groups = new Map<number, { value: number; date: string; zScore: number }[]>();
  for (const a of anomalies) {
    const key = Math.round(a.value);
    const group = groups.get(key) ?? [];
    group.push(a);
    groups.set(key, group);
  }

  const findings: Finding[] = [];
  let groupIndex = 0;

  for (const [, group] of groups) {
    const dates = group.map((g) => g.date);
    const maxZScore = Math.max(...group.map((g) => Math.abs(g.zScore)));
    const representativeValue = group[0].value;
    const occurrenceCount = group.length;

    const dateList =
      dates.length <= MAX_DATES_LISTED
        ? dates.join(", ")
        : `${dates.slice(0, MAX_DATES_LISTED).join(", ")}, and ${dates.length - MAX_DATES_LISTED} more`;

    const plainLanguage =
      occurrenceCount === 1
        ? `In simple terms: on this date, ${columnName} was way higher or lower than normal — worth checking what happened.`
        : `In simple terms: ${columnName} hit this unusual value repeatedly (${occurrenceCount} times) — worth checking if this is a real pattern or a data entry issue.`;

    const description =
      occurrenceCount === 1
        ? `${columnName} had an unusual value of ${representativeValue} on ${dates[0]}, ${maxZScore.toFixed(1)} standard deviations from the average. ${plainLanguage}`
        : `${columnName} had an unusual value of approximately ${representativeValue} on ${occurrenceCount} separate dates (${dateList}), up to ${maxZScore.toFixed(1)} standard deviations from the average. ${plainLanguage}`;

    findings.push({
      id: `anomaly-${columnName}-${groupIndex}-${datasetId}`,
      datasetId,
      type: "anomaly",
      variablesInvolved: [columnName],
      period: {
        start: dates[0] ?? "",
        end: dates[dates.length - 1] ?? "",
      },
      magnitude: maxZScore,
      rankScore: 0,
      description,
    });

    groupIndex++;
  }

  return findings;
}

function average(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function standardDeviation(values: number[], mean: number): number {
  const variance =
    values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}
