import { describe, it, expect } from "vitest";
import { runInvestigation } from "@/core/investigation-engine/investigate";
import { compareGroups } from "@/core/investigation-engine/comparisonEngine";
import { pearsonCorrelation } from "@/core/diagnostic-engine/statsHelpers";
import { scoreContributor } from "@/core/diagnostic-engine/contributorScorer";
import type { ColumnProfile, Dataset } from "@/models/types";

describe("missing values are skipped, never counted as zero", () => {
  it("one empty cell does not change the answer", () => {
    // 8 real values: four 10s then four 20s = +100%. The empty cell must be ignored.
    const rows = [10, 10, 10, 10, null, 20, 20, 20, 20].map((v) => ({ output: v }));
    const dataset = {
      id: "d",
      filename: "t.csv",
      uploadedAt: "",
      rowCount: rows.length,
      columns: [
        {
          name: "output",
          type: "numeric",
          missingCount: 1,
          duplicateFlag: false,
          qualityIssues: [],
        },
      ],
    } as unknown as Dataset;

    const result = runInvestigation({
      datasetId: "d",
      dataset,
      rows,
      question: "Investigate output",
    });

    expect(result.needsClarification).toBe(false);
    expect(result.finding!.magnitude).toBeCloseTo(100, 5);
    expect(result.finding!.description).toContain("increased by 100.0%");
  });
});

describe("comparison maths", () => {
  it("10 to 15 is +50%", () => {
    const r = compareGroups([10, 10], [15, 15])!;
    expect(r.percentChange).toBeCloseTo(50, 5);
  });
  it("a zero baseline is refused, not divided by zero", () => {
    expect(compareGroups([0, 0], [5, 5])).toBeNull();
  });
});

describe("correlation ignores missing values", () => {
  it("a gap does not break a perfect relationship", () => {
    expect(
      pearsonCorrelation([1, 2, NaN, 4, 5], [2, 4, 6, 8, 10])
    ).toBeCloseTo(1, 5);
  });
});

describe("contradicting evidence scale", () => {
  it("a random up/down pattern is fully inconsistent", () => {
    // x always rises; y alternates up/down: 2 of 4 moves agree = 0.5 = no pattern.
    const result = scoreContributor({
      candidate: { name: "x" } as ColumnProfile,
      candidateValues: [1, 2, 3, 4, 5],
      targetValues: [1, 2, 1, 2, 1],
      baselineIndices: [0, 1],
      comparisonIndices: [2, 3, 4],
    });
    expect(result.scoreBreakdown.consistency).toBe(0.5);
    expect(result.scoreBreakdown.contradictingEvidence).toBe(1);
  });
});
