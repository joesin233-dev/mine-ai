// MINE AI V0.1 — Discovery Engine: Anomaly Detector
// Stage 4: flags data points that sit unusually far from the rest of the
// column's values, using a standard z-score. Repeated occurrences of the
// same (or very close) unusual value are grouped into a single finding,
// so a recurring pattern doesn't flood the results with near-duplicates.

import type { Finding } from "@/models/types";

const Z_SCORE_THRESHOLD = 2;
const MAX_DATES_LISTED = 5;

export function detectAnomalies(
  datasetId: string,
  columnName: string,
  values: number[],
  rowDates: string[]
): Finding[] {
  if (values.length < 4) return [];

  const mean = average(values);
  const stdDev = standardDeviation(values, mean);

  if (stdDev === 0) return [];

  const anomalies: { value: number; date: string; zScore: number }[] = [];
  values.forEach((value, index) => {
    const zScore = (value - mean) / stdDev;
    if (Math.abs(zScore) >= Z_SCORE_THRESHOLD) {
      anomalies.push({ value: value, date: rowDates[index] || "an unknown date", zScore: zScore });
    }
  });

  if (anomalies.length === 0) return [];

  const groups = new Map<number, { value: number; date: string; zScore: number }[]>();
  for (let i = 0; i < anomalies.length; i++) {
    const a = anomalies[i];
    const key = Math.round(a.value);
    const existing = groups.get(key);
    const group = existing ? existing : [];
    group.push(a);
    groups.set(key, group);
  }

  const findings: Finding[] = [];
  let groupIndex = 0;

  groups.forEach(function (group) {
    const dates = group.map(function (g) { return g.date; });
    const zScores = group.map(function (g) { return Math.abs(g.zScore); });
    const maxZScore = Math.max.apply(null, zScores);
    const representativeValue = group[0].value;
    const occurrenceCount = group.length;

    let dateList;
    if (dates.length <= MAX_DATES_LISTED) {
      dateList = dates.join(", ");
    } else {
      const shown = dates.slice(0, MAX_DATES_LISTED).join(", ");
      const remaining = dates.length - MAX_DATES_LISTED;
      dateList = shown + ", and " + remaining + " more";
    }

    let plainLanguage;
    if (occurrenceCount === 1) {
      plainLanguage = "In simple terms: on this date, " + columnName + " was way higher or lower than normal, worth checking what happened.";
    } else {
      plainLanguage = "In simple terms: " + columnName + " hit this unusual value repeatedly (" + occurrenceCount + " times), worth checking if this is a real pattern or a data entry issue.";
    }

    let description;
    if (occurrenceCount === 1) {
      description = columnName + " had an unusual value of " + representativeValue + " on " + dates[0] + ", " + maxZScore.toFixed(1) + " standard deviations from the average. " + plainLanguage;
    } else {
      description = columnName + " had an unusual value of approximately " + representativeValue + " on " + occurrenceCount + " separate dates (" + dateList + "), up to " + maxZScore.toFixed(1) + " standard deviations from the average. " + plainLanguage;
    }

    findings.push({
      id: "anomaly-" + columnName + "-" + groupIndex + "-" + datasetId,
      datasetId: datasetId,
      type: "anomaly",
      variablesInvolved: [columnName],
      period: {
        start: dates[0] || "",
        end: dates[dates.length - 1] || "",
      },
      magnitude: maxZScore,
      rankScore: 0,
      description: description,
    });

    groupIndex++;
  });

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
