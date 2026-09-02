// Stage 8 test — verifies the economic engine never invents a value when
// inputs are missing, and calculates correctly when they're provided.

import { describe, it, expect } from "vitest";
import { promises as fs } from "fs";
import path from "path";
import { parseCsv } from "../core/data-engine/parser";
import { profileDataset } from "../core/data-engine/profiler";
import { calculateEconomicImpact } from "../core/economic-engine/impactCalculator";
import type { Finding } from "../models/types";

const testFinding: Finding = {
  id: "test-finding",
  datasetId: "test-id",
  type: "change",
  variablesInvolved: ["production_tons"],
  period: { start: "2026-01-01", end: "2026-02-07" },
  magnitude: 14,
  rankScore: 14,
  description: "production_tons decreased",
};

describe("economic engine (Stage 8)", () => {
  it("returns null result and lists missing inputs when valuePerUnit is not provided", async () => {
    const filePath = path.join(process.cwd(), "tests/fixtures/sample-production.csv");
    const buffer = await fs.readFile(filePath);
    const parsed = parseCsv(buffer);
    const dataset = profileDataset("test-id", "sample-production.csv", parsed);

    const result = calculateEconomicImpact({
      finding: testFinding,
      dataset,
      rows: parsed.rows,
      providedInputs: {},
    });

    expect(result.result).toBeNull();
    expect(result.missingInputs).toContain("valuePerUnit");
  });

  it("calculates a real result when valuePerUnit is provided", async () => {
    const filePath = path.join(process.cwd(), "tests/fixtures/sample-production.csv");
    const buffer = await fs.readFile(filePath);
    const parsed = parseCsv(buffer);
    const dataset = profileDataset("test-id", "sample-production.csv", parsed);

    const result = calculateEconomicImpact({
      finding: testFinding,
      dataset,
      rows: parsed.rows,
      providedInputs: { valuePerUnit: 50 },
    });

    expect(result.result).not.toBeNull();
    expect(result.valueType).toBe("calculated");
    expect(result.formula).toContain("production_tons");
    // Production dropped, so the result should be negative (a loss).
    expect(result.result!).toBeLessThan(0);
  });

  it("never invents a value — result is exactly derived from real data and the provided input", async () => {
    const filePath = path.join(process.cwd(), "tests/fixtures/sample-production.csv");
    const buffer = await fs.readFile(filePath);
    const parsed = parseCsv(buffer);
    const dataset = profileDataset("test-id", "sample-production.csv", parsed);

    const resultA = calculateEconomicImpact({
      finding: testFinding,
      dataset,
      rows: parsed.rows,
      providedInputs: { valuePerUnit: 10 },
    });
    const resultB = calculateEconomicImpact({
      finding: testFinding,
      dataset,
      rows: parsed.rows,
      providedInputs: { valuePerUnit: 20 },
    });

    // Doubling valuePerUnit must exactly double the result — proves it's a
    // real calculation, not a made-up number.
    expect(resultB.result!).toBeCloseTo(resultA.result! * 2, 5);
  });
});
