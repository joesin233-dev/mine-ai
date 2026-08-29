// MINE AI V0.1 — Data Engine: Profiler
// Stage 3: turns validated rows into a full Dataset profile — column types,
// statistics, and data-quality flags. This is where "raw rows" becomes
// "understood data." No interpretation of meaning happens here — only
// structure, types, and numbers.

import type { ParseResult } from "./parser";
import type { ColumnProfile, ColumnType, NumericStats, Dataset } from "@/models/types";

/**
 * Guesses a column's type by inspecting its actual values.
 * A column is "numeric" only if every non-null value is a real number.
 * A column is "datetime" if every non-null value parses as a valid date
 * AND looks like a date string (contains - or / — avoids treating plain
 * numbers as dates).
 * Otherwise it's "categorical". Empty columns are "unknown".
 */
function detectColumnType(values: (string | number | null)[]): ColumnType {
  const nonNull = values.filter((v) => v !== null && v !== "");
  if (nonNull.length === 0) return "unknown";

  const allNumeric = nonNull.every(
    (v) => typeof v === "number" && !Number.isNaN(v)
  );
  if (allNumeric) return "numeric";

  const looksLikeDate = (v: string | number) =>
    typeof v === "string" &&
    /[-/]/.test(v) &&
    !Number.isNaN(Date.parse(v));

  const allDates = nonNull.every(looksLikeDate);
  if (allDates) return "datetime";

  return "categorical";
}

function computeNumericStats(values: number[]): NumericStats {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;

  const mean = sorted.reduce((sum, v) => sum + v, 0) / n;

  const median =
    n % 2 === 0
      ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
      : sorted[(n - 1) / 2];

  const min = sorted[0];
  const max = sorted[n - 1];

  const variance =
    sorted.reduce((sum, v) => sum + (v - mean) ** 2, 0) / n;
  const stdDev = Math.sqrt(variance);

  const percentile = (p: number): number => {
    const idx = (p / 100) * (n - 1);
    const lower = Math.floor(idx);
    const upper = Math.ceil(idx);
    if (lower === upper) return sorted[lower];
    const weight = idx - lower;
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  };

  return {
    mean,
    median,
    min,
    max,
    stdDev,
    percentiles: {
      p25: percentile(25),
      p50: percentile(50),
      p75: percentile(75),
      p90: percentile(90),
    },
  };
}

function profileColumn(
  name: string,
  values: (string | number | null)[]
): ColumnProfile {
  const missingCount = values.filter((v) => v === null || v === "").length;
  const type = detectColumnType(values);

  const qualityIssues: string[] = [];
  if (missingCount > 0) {
    qualityIssues.push(`${missingCount} missing value(s)`);
  }

  let stats: NumericStats | undefined;
  if (type === "numeric") {
    const numericValues = values.filter(
      (v): v is number => typeof v === "number" && !Number.isNaN(v)
    );
    if (numericValues.length > 0) {
      stats = computeNumericStats(numericValues);
    }
  }

  // Duplicate-value flag is a column-level signal (e.g. an ID column that
  // should be unique but isn't) — only meaningful for non-numeric columns
  // where repeats might indicate a data problem rather than being expected.
  const nonNullValues = values.filter((v) => v !== null && v !== "");
  const uniqueCount = new Set(nonNullValues).size;
  const duplicateFlag =
    type !== "numeric" &&
    nonNullValues.length > 0 &&
    uniqueCount < nonNullValues.length;

  return {
    name,
    type,
    missingCount,
    duplicateFlag,
    stats,
    qualityIssues,
  };
}

/**
 * Builds the full Dataset profile from a parse result.
 * This is the Stage 3 replacement for the Stage 2 placeholder that only
 * recorded column names with type "unknown".
 */
export function profileDataset(
  datasetId: string,
  filename: string,
  parseResult: ParseResult
): Dataset {
  const columns: ColumnProfile[] = parseResult.headers.map((header) => {
    const columnValues = parseResult.rows.map((row) => row[header] ?? null);
    return profileColumn(header, columnValues);
  });

  return {
    id: datasetId,
    filename,
    uploadedAt: new Date().toISOString(),
    rowCount: parseResult.rowCount,
    columns,
  };
}
