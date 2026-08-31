// Stage 6 test — verifies the diagnostic engine identifies downtime_hours
// as a strong contributor to the production_tons drop in the fixture data,
// and that causation is never claimed in the output text.

import { describe, it, expect } from "vitest";
import { promises as fs } from "fs";
import path from "path";
import { parseCsv } from "../core/data-engine/parser";
import { profileDataset } from "../core/data-engine/profiler";
import { runDiagnostics } from "../core/diagnostic-engine/diagnose";
import type { Finding } from "../models/types";

describe("diagnostic engine (Stage 6)", () => {
  it("identifies downtime_hours as a top contributor to the production change", async () => {
    const filePath = path.join(process.cwd(), "tests/fixtures/sample-production.csv");
    const buffer = await fs.readFile(filePath);
    const parsed = parseCsv(buffer);
    const dataset = profileDataset("test-id", "sample-production.csv", parsed);

    const finding: Finding = {
      id: "test-finding",
      datasetId: "test-id",
      type: "change",
      variablesInvolved: ["production_tons"],
      period: { start: "2026-01-01", end: "2026-02-07" },
      magnitude: 14,
      rankScore: 14,
      description: "production_tons decreased",
    };

    const result = runDiagnostics({ finding, dataset, rows: parsed.rows });

    expect(result.contributors.length).toBeGreaterThan(0);
    const downtime = result.contributors.find((c) => c.variableName === "downtime_hours");
    expect(downtime).toBeDefined();
    expect(["high", "medium"]).toContain(downtime!.evidenceStrength);
  });

  it("never uses causal language like 'caused' in contributor output", async () => {
    const filePath = path.join(process.cwd(), "tests/fixtures/sample-production.csv");
    const buffer = await fs.readFile(filePath);
    const parsed = parseCsv(buffer);
    const dataset = profileDataset("test-id", "sample-production.csv", parsed);

    const finding: Finding = {
      id: "test-finding",
      datasetId: "test-id",
      type: "change",
      variablesInvolved: ["production_tons"],
      period: { start: "2026-01-01", end: "2026-02-07" },
      magnitude: 14,
      rankScore: 14,
      description: "production_tons decreased",
    };

    const result = runDiagnostics({ finding, dataset, rows: parsed.rows });

    for (const contributor of result.contributors) {
      expect(contributor.observedChange.toLowerCase()).not.toContain("caused");
      expect(contributor.observedChange.toLowerCase()).not.toContain("because");
    }
  });

  it("provides alternative explanations", async () => {
    const filePath = path.join(process.cwd(), "tests/fixtures/sample-production.csv");
    const buffer = await fs.readFile(filePath);
    const parsed = parseCsv(buffer);
    const dataset = profileDataset("test-id", "sample-production.csv", parsed);

    const finding: Finding = {
      id: "test-finding",
      datasetId: "test-id",
      type: "change",
      variablesInvolved: ["production_tons"],
      period: { start: "2026-01-01", end: "2026-02-07" },
      magnitude: 14,
      rankScore: 14,
      description: "production_tons decreased",
    };

    const result = runDiagnostics({ finding, dataset, rows: parsed.rows });

    expect(result.alternativeExplanations.length).toBeGreaterThan(0);
  });
});
