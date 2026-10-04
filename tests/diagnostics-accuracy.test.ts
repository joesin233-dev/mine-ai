import { describe, it, expect } from "vitest";
import {
  pearsonCorrelation,
  directionalConsistency,
  signAwareConsistency,
} from "@/core/diagnostic-engine/statsHelpers";
import { scoreContributor } from "@/core/diagnostic-engine/contributorScorer";
import { calculateConfidence } from "@/core/evidence-engine/confidenceCalculator";
import type { ColumnProfile, Contributor } from "@/models/types";

describe("correlation (hand-checked)", () => {
  it("perfect positive and negative", () => {
    expect(pearsonCorrelation([1, 2, 3, 4, 5], [2, 4, 6, 8, 10])).toBeCloseTo(1, 5);
    expect(pearsonCorrelation([1, 2, 3, 4, 5], [10, 8, 6, 4, 2])).toBeCloseTo(-1, 5);
  });
  it("known value 0.5", () => {
    expect(pearsonCorrelation([1, 2, 3], [1, 3, 2])).toBeCloseTo(0.5, 5);
  });
});

describe("consistency (hand-checked)", () => {
  it("always-opposite movement is consistent, not contradicting", () => {
    const x = [1, 2, 3, 4, 5];
    const y = [10, 8, 6, 4, 2];
    expect(directionalConsistency(x, y)).toBe(0);
    expect(signAwareConsistency(x, y)).toBe(1);
  });
  it("same direction", () => {
    expect(signAwareConsistency([1, 2, 3], [5, 6, 7])).toBe(1);
  });
  it("mixed: 2 of 3 moves agree", () => {
    expect(signAwareConsistency([1, 2, 3, 4], [1, 2, 1, 2])).toBeCloseTo(2 / 3, 5);
  });
});

describe("scoreContributor", () => {
  it("a column that falls 20% while the target rises is consistent, not contradicting", () => {
    const candidate = [100, 100, 100, 100, 100, 100, 80, 80, 80, 80, 80, 80];
    const target = [10, 10, 10, 10, 10, 10, 20, 20, 20, 20, 20, 20];
    const result = scoreContributor({
      candidate: { name: "cost" } as ColumnProfile,
      candidateValues: candidate,
      targetValues: target,
      baselineIndices: [0, 1, 2, 3, 4, 5],
      comparisonIndices: [6, 7, 8, 9, 10, 11],
    });
    expect(result.observedChange).toBe("decreased by 20.0%");
    expect(result.scoreBreakdown.correlation).toBe(1);
    expect(result.scoreBreakdown.consistency).toBe(1);
    expect(result.scoreBreakdown.contradictingEvidence).toBe(0);
  });
});

const contributor = (consistency: number): Contributor => ({
  variableName: "x",
  observedChange: "increased by 10.0%",
  evidenceStrength: "high",
  scoreBreakdown: {
    magnitude: 1,
    temporalAlignment: 1,
    correlation: 1,
    consistency,
    contradictingEvidence: 1 - consistency,
  },
});

describe("calculateConfidence", () => {
  it("14 rows is held at medium even with a strong contributor", () => {
    expect(calculateConfidence([contributor(1)], 14).confidence).toBe("medium");
  });
  it("20+ rows with strong, consistent evidence is high", () => {
    expect(calculateConfidence([contributor(1)], 20).confidence).toBe("high");
  });
  it("strong but inconsistent evidence is held at medium", () => {
    expect(calculateConfidence([contributor(0.3)], 30).confidence).toBe("medium");
  });
  it("no contributors is low", () => {
    expect(calculateConfidence([], 30).confidence).toBe("low");
  });
});
