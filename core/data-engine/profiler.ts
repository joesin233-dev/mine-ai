import { assessQuality } from "./qualityChecks";
// MINE AI V0.1 — Data Engine: Profiler
// Stage 3: turns validated rows into a full Dataset profile — column types,
// statistics, and data-quality flags. This is where "raw rows" becomes
// "understood data." No interpretation of meaning happens here — only
// structure, types, and numbers.
//
// Update: the plain-English summary now compares the first half of the data
// with the second half (in date order when a date column exists), so a column
// that clearly shifted is never described as "steady".

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
  const nonNull = values.filter(
    (v): v is string | number => v !== null && v !== ""
  );
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
const quality = assessQuality(parseResult, columns);
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

/**
 * Formats a number for plain-English display: thousand separators and a
 * sensible number of decimals (big numbers are rounded, small ones keep detail).
 */
function formatNumber(n: number): string {
  const abs = Math.abs(n);
  const decimals = abs >= 100 ? 0 : abs >= 10 ? 1 : 2;
  return n.toLocaleString("en-US", { maximumFractionDigits: decimals });
}

function average(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Builds a one-sentence, plain-English summary of a numeric column's
 * shape, so non-technical readers don't need to interpret raw statistics
 * themselves.
 *
 * `orderedValues` are the column's numbers in time order (date order when the
 * file has a date column, otherwise file order). They are used to check
 * whether the second half of the data differs clearly from the first half.
 */
function buildPlainSummary(
  name: string,
  stats: NumericStats,
  orderedValues: number[]
): string {
  const range = `ranging from ${formatNumber(stats.min)} to ${formatNumber(
    stats.max
  )}`;

  // 1) Did the column shift between the first half and the second half?
  const n = orderedValues.length;
  if (n >= 6 && stats.stdDev > 0) {
    const half = Math.floor(n / 2);
    const firstAvg = average(orderedValues.slice(0, half));
    const secondAvg = average(orderedValues.slice(n - half));
    const diff = secondAvg - firstAvg;
    const pctChange =
      firstAvg !== 0 ? Math.abs(diff / firstAvg) : Infinity;

    // A "real" shift needs to be big in relative terms (10%+) AND big
    // compared with the normal day-to-day spread (at least half a std dev).
    const isShift = pctChange >= 0.1 && Math.abs(diff) >= 0.5 * stats.stdDev;

    if (isShift) {
      const direction = diff > 0 ? "up" : "down";
      const pctText =
        Number.isFinite(pctChange) ? ` (${direction} ${Math.round(pctChange * 100)}%)` : "";
      return `In simple terms: ${name} moved from about ${formatNumber(
        firstAvg
      )} in the first half of the data to about ${formatNumber(
        secondAvg
      )} in the second half${pctText}, ${range}.`;
    }
  }

  // 2) No clear shift — describe how much it varies overall.
  const spread =
    stats.mean !== 0 ? stats.stdDev / Math.abs(stats.mean) : Infinity;
  const consistency =
    spread < 0.1
      ? "stayed fairly steady, without big swings"
      : spread < 0.3
      ? "varied a moderate amount"
      : "varied quite a lot from period to period";

  return `In simple terms: ${name} averaged around ${formatNumber(
    stats.mean
  )}, and ${consistency} (${range}).`;
}

function profileColumn(
  name: string,
  values: (string | number | null)[],
  orderedValues: (string | number | null)[]
): ColumnProfile {
  const missingCount = values.filter((v) => v === null || v === "").length;
  const type = detectColumnType(values);

  const qualityIssues: string[] = [];
  if (missingCount > 0) {
    qualityIssues.push(`${missingCount} missing value(s)`);
  }

  let stats: NumericStats | undefined;
  let plainSummary: string | undefined;
  if (type === "numeric") {
    const numericValues = values.filter(
      (v): v is number => typeof v === "number" && !Number.isNaN(v)
    );
    const orderedNumeric = orderedValues.filter(
      (v): v is number => typeof v === "number" && !Number.isNaN(v)
    );
    if (numericValues.length > 0) {
      stats = computeNumericStats(numericValues);
      plainSummary = buildPlainSummary(name, stats, orderedNumeric);
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
    plainSummary,
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
  // Find the first date column (if any) so "first half vs second half"
  // really means earlier vs later, even if the file rows are shuffled.
  const dateHeader = parseResult.headers.find(
    (header) =>
      detectColumnType(parseResult.rows.map((row) => row[header] ?? null)) ===
      "datetime"
  );

  const timeOf = (row: (typeof parseResult.rows)[number]): number => {
    if (!dateHeader) return 0;
    const v = row[dateHeader];
    if (v === null || v === undefined || v === "") return Infinity;
    const t = Date.parse(String(v));
    return Number.isNaN(t) ? Infinity : t;
  };

  const orderedRows = dateHeader
    ? [...parseResult.rows].sort((a, b) => {
        const ta = timeOf(a);
        const tb = timeOf(b);
        return ta < tb ? -1 : ta > tb ? 1 : 0;
      })
    : parseResult.rows;

  const columns: ColumnProfile[] = parseResult.headers.map((header) => {
    const columnValues = parseResult.rows.map((row) => row[header] ?? null);
    const orderedValues = orderedRows.map((row) => row[header] ?? null);
    return profileColumn(header, columnValues, orderedValues);
  });

  return {
    id: datasetId,
    filename,
    uploadedAt: new Date().toISOString(),
    rowCount: parseResult.rowCount,
    columns,
  };
}
