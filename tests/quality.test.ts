import { describe, it, expect } from "vitest";
import { profileDataset } from "@/core/data-engine/profiler";

const make = (headers: string[], rows: any[]) =>
  ({ headers, rows, rowCount: rows.length }) as any;

describe("quality checks", () => {
  it("flags missing, duplicates, gaps and impossible values", () => {
    const rows = [
      { date: "2026-01-01", tons: 10, pct_done: 50 },
      { date: "2026-01-02", tons: 11, pct_done: 55 },
      { date: "2026-01-03", tons: 12, pct_done: 60 },
      { date: "2026-01-04", tons: -5, pct_done: 65 },
      { date: "2026-01-05", tons: null, pct_done: 130 },
      { date: "2026-01-06", tons: 13, pct_done: 70 },
      { date: "2026-01-06", tons: 13, pct_done: 70 },
      { date: "2026-01-20", tons: 12, pct_done: 75 },
    ];
    const ds = profileDataset("t1", "t.csv", make(["date", "tons", "pct_done"], rows));
    const checks = ds.quality!.issues.map((i) => i.check);
    expect(checks).toContain("missing");
    expect(checks).toContain("duplicates");
    expect(checks).toContain("date_gaps");
    expect(checks).toContain("impossible");
    expect(ds.quality!.rating).toBe("usable_with_warnings");
  });

  it("rates clean data as good", () => {
    const rows = Array.from({ length: 12 }, (_, i) => ({
      date: `2026-01-${String(i + 1).padStart(2, "0")}`,
      tons: 10 + i,
    }));
    const ds = profileDataset("t2", "c.csv", make(["date", "tons"], rows));
    expect(ds.quality!.rating).toBe("good");
  });
});

describe("profiler wording", () => {
  it("never says steady when the second half shifts", () => {
    const rows = Array.from({ length: 12 }, (_, i) => ({
      output: i < 6 ? 10 : 20,
    }));
    const ds = profileDataset("t3", "s.csv", make(["output"], rows));
    expect(ds.columns[0].plainSummary).toContain("moved from");
    expect(ds.columns[0].plainSummary).not.toContain("steady");
  });
});
