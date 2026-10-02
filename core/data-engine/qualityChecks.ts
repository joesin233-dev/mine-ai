import type { ParseResult } from "./parser";
import type {
  ColumnProfile,
  QualityIssue,
  QualityRating,
  QualityReport,
} from "@/models/types";

const NON_NEGATIVE = new Set([
  "quantity","qty","count","hours","hrs","price","amount","ton","tons",
  "tonne","tonnes","unit","units","sales","cost","production","downtime",
  "weight","volume","distance","age",
]);
const PERCENT = new Set(["percent","percentage","pct","%"]);
const DAY = 86400000;

const tokens = (name: string) =>
  name.toLowerCase().split(/[^a-z%]+/).filter(Boolean);

const LABELS: Record<QualityRating, string> = {
  good: "Good",
  usable_with_warnings: "Usable with warnings",
  not_reliable: "Not reliable",
};

export function assessQuality(
  parse: ParseResult,
  columns: ColumnProfile[]
): QualityReport {
  const issues: QualityIssue[] = [];
  const rows = parse.rows;
  const total = rows.length;

  if (total === 0) {
    issues.push({ check: "size", severity: "serious", count: 0,
      message: "The file has no data rows." });
    return finish(issues);
  }
  if (total < 10) {
    issues.push({ check: "size", severity: "info", count: total,
      message: `Only ${total} rows, so patterns may not be reliable.` });
  }

  // 1) Missing values
  for (const c of columns) {
    if (c.missingCount === 0) continue;
    const pct = c.missingCount / total;
    issues.push({
      check: "missing", column: c.name, count: c.missingCount,
      severity: pct >= 0.5 ? "serious" : pct >= 0.1 ? "warning" : "info",
      message: `${c.name}: ${c.missingCount} missing (${Math.round(pct * 100)}%).`,
    });
  }

  // 2) Duplicate rows
  const seen = new Set<string>();
  let dup = 0;
  for (const row of rows) {
    const key = JSON.stringify(parse.headers.map((h) => row[h] ?? null));
    if (seen.has(key)) dup++;
    else seen.add(key);
  }
  if (dup > 0) {
    const pct = dup / total;
    issues.push({
      check: "duplicates", count: dup,
      severity: pct >= 0.2 ? "serious" : "warning",
      message: `${dup} duplicate row(s) (${Math.round(pct * 100)}% of the file).`,
    });
  }

  // 3) Date gaps + future dates
  const dateCol = columns.find((c) => c.type === "datetime");
  if (dateCol) {
    const times = rows
      .map((r) => Date.parse(String(r[dateCol.name])))
      .filter((t) => !Number.isNaN(t));
    const future = times.filter((t) => t > Date.now()).length;
    if (future > 0) {
      issues.push({ check: "impossible", column: dateCol.name, count: future,
        severity: "warning",
        message: `${dateCol.name}: ${future} date(s) are in the future.` });
    }
    const days = [...new Set(times.map((t) => Math.floor(t / DAY)))].sort(
      (a, b) => a - b
    );
    if (days.length >= 4) {
      const diffs = days.slice(1).map((d, i) => d - days[i]);
      const sorted = [...diffs].sort((a, b) => a - b);
      const median = sorted[Math.floor(sorted.length / 2)];
      const big = diffs.filter((d) => d > median * 3);
      if (big.length > 0) {
        issues.push({
          check: "date_gaps", column: dateCol.name, count: big.length,
          severity: "warning",
          message: `${dateCol.name}: ${big.length} gap(s) in the dates, the longest is ${Math.max(...big)} days (normal spacing is about ${median} day(s)).`,
        });
      }
    }
  }

  // 4) Impossible values (conservative: only by column-name hints)
  for (const c of columns) {
    if (c.type !== "numeric" || !c.stats) continue;
    const t = tokens(c.name);
    const values = rows
      .map((r) => r[c.name])
      .filter((v): v is number => typeof v === "number" && !Number.isNaN(v));
    if (t.some((x) => PERCENT.has(x))) {
      const bad = values.filter((v) => v < 0 || v > 100).length;
      if (bad > 0) addImpossible(c.name, bad, values.length, "outside 0–100");
    } else if (t.some((x) => NON_NEGATIVE.has(x))) {
      const bad = values.filter((v) => v < 0).length;
      if (bad > 0) addImpossible(c.name, bad, values.length, "negative");
    }
  }

  function addImpossible(name: string, bad: number, n: number, what: string) {
    issues.push({
      check: "impossible", column: name, count: bad,
      severity: bad / n >= 0.2 ? "serious" : "warning",
      message: `${name}: ${bad} value(s) look impossible (${what}).`,
    });
  }

  return finish(issues);
}

function finish(issues: QualityIssue[]): QualityReport {
  const rating: QualityRating = issues.some((i) => i.severity === "serious")
    ? "not_reliable"
    : issues.some((i) => i.severity === "warning")
    ? "usable_with_warnings"
    : "good";
  const n = issues.filter((i) => i.severity !== "info").length;
  const summary =
    rating === "good"
      ? "No significant data-quality problems found."
      : `${LABELS[rating]}: ${n} issue(s) need attention. Check them before trusting the findings.`;
  return { rating, ratingLabel: LABELS[rating], summary, issues };
}
