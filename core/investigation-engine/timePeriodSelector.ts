// MINE AI V0.1 — Investigation Engine: Time Period Selector
// Stage 5: looks for a month name in the question (e.g. "in July") and, if
// found, splits the dataset's rows into "that period" vs "everything else"
// using the row-order date labels. If no month is mentioned, returns null
// and the caller falls back to a simple first-half/second-half comparison.

const MONTH_NAMES = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];

export interface TimePeriodMatch {
  monthIndex: number; // 0-11
  monthName: string;
}

export function selectTimePeriod(questionText: string): TimePeriodMatch | null {
  const lower = questionText.toLowerCase();
  for (let i = 0; i < MONTH_NAMES.length; i++) {
    if (lower.includes(MONTH_NAMES[i])) {
      return { monthIndex: i, monthName: MONTH_NAMES[i] };
    }
  }
  return null;
}

/**
 * Splits row indices into "in period" and "outside period" based on a date
 * string column value (expects a parseable date like "2026-02-01").
 */
export function splitRowsByMonth(
  dateValues: (string | number | null)[],
  monthIndex: number
): { inPeriod: number[]; outsidePeriod: number[] } {
  const inPeriod: number[] = [];
  const outsidePeriod: number[] = [];

  dateValues.forEach((value, index) => {
    if (typeof value !== "string") {
      outsidePeriod.push(index);
      return;
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      outsidePeriod.push(index);
      return;
    }
    if (parsed.getMonth() === monthIndex) {
      inPeriod.push(index);
    } else {
      outsidePeriod.push(index);
    }
  });

  return { inPeriod, outsidePeriod };
}
