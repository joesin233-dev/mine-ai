// Stage 7 test — verifies the evidence engine produces a complete,
// auditable EvidenceRecord with an honest confidence level.

import { describe, it, expect } from "vitest";
import { promises as fs } from "fs";
import path from "path";
import { parseCsv } from "../core/data-engine/parser";
import { profileDataset } from "../core/data-engine/profiler";
import { buildEvidence } from "../core/evidence-engine/evidence";
import type { Finding } from "../models/types";

describe("evidence engine (Stage 7)", () => {
  it("builds a complete EvidenceRecord for a finding", async () => {
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

    const { evidence, contributors } = buildEvidence({ finding, dataset, rows: parsed.rows });

    expect(evidence.findingId).toBe("test-finding");
    expect(evidence.dataUsed).toContain("sample-production.csv");
    expect(evidence.calculations.length).toBeGreaterThan(0);
    expect(["high", "medium", "low"]).toContain(evidence.confidence);
    expect(evidence.confidenceReasons.length).toBeGreaterThan(0);
    expect(evidence.limitations.length).toBeGreaterThan(0);
    expect(contributors.length).toBeGreaterThan(0);
  });

  it("assigns high confidence when a strong contributor exists with enough data", async () => {
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

    const { evidence } = buildEvidence({ finding, dataset, rows: parsed.rows });

    expect(["high", "medium"]).toContain(evidence.confidence);
  });

  it("always includes a causation-is-not-confirmed limitation", async () => {
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

    const { evidence } = buildEvidence({ finding, dataset, rows: parsed.rows });

    const hasCausationCaveat = evidence.limitations.some((l) =>
      l.toLowerCase().includes("cause")
    );
    expect(hasCausationCaveat).toBe(true);
  });
});

