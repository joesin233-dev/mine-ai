import { describe, it, expect } from "vitest";
import { suggestQuestions } from "@/core/investigation-engine/suggestQuestions";
import { parseQuestion } from "@/core/investigation-engine/questionParser";
import { selectVariables } from "@/core/investigation-engine/variableSelector";
import type { ColumnProfile, Finding } from "@/models/types";

const stats = {
  mean: 10, median: 10, min: 1, max: 20, stdDev: 3, percentiles: {},
};
const col = (name: string, type: ColumnProfile["type"]): ColumnProfile => ({
  name, type, missingCount: 0, duplicateFlag: false,
  stats: type === "numeric" ? stats : undefined,
  qualityIssues: [],
});

const columns: ColumnProfile[] = [
  col("date", "datetime"),
  col("Region", "categorical"),
  col("Quantity Sold (kg)", "numeric"),
  col("Price_per_kg", "numeric"),
  col("downtime_hours", "numeric"),
];

const finding = (
  id: string, type: Finding["type"], vars: string[], rankScore: number
): Finding => ({
  id, datasetId: "d", type, variablesInvolved: vars,
  period: { start: "a", end: "b" }, magnitude: 1, rankScore, description: "",
});

describe("suggestQuestions", () => {
  it("every suggestion resolves to real columns", () => {
    const s = suggestQuestions(columns, [
      finding("1", "trend", ["Quantity Sold (kg)"], 9),
      finding("2", "relationship", ["Price_per_kg", "downtime_hours"], 5),
    ]);
    expect(s.length).toBeGreaterThan(0);
    for (const q of s) {
      const m = selectVariables(parseQuestion(q.question), columns);
      expect(m.length).toBeGreaterThan(0);
    }
  });

  it("puts the strongest finding first and never suggests text columns", () => {
    const s = suggestQuestions(columns, [
      finding("1", "trend", ["Quantity Sold (kg)"], 9),
    ]);
    expect(s[0].label).toContain("trend");
    expect(s.some((q) => q.label.includes("Region"))).toBe(false);
  });

  it("still works with no findings, capped at 6", () => {
    const s = suggestQuestions(columns, []);
    expect(s.length).toBeGreaterThan(0);
    expect(s.length).toBeLessThanOrEqual(6);
  });
});
