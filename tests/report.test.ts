// Stage 10 test — verifies the report builder assembles a complete report
// and renders valid markdown containing all required sections.

import { describe, it, expect } from "vitest";
import { promises as fs } from "fs";
import path from "path";
import { parseCsv } from "../core/data-engine/parser";
import { profileDataset } from "../core/data-engine/profiler";
import { buildEvidence } from "../core/evidence-engine/evidence";
import { buildReport, reportToMarkdown } from "../core/report-engine/reportBuilder";
import type { Finding } from "../models/types";

describe("report engine (Stage 10)", () => {
  it("builds a complete Report object", async () => {
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
    const report = buildReport({ finding, evidence, contributors, economicImpact: null });

    expect(report.analysisId).toBe("test-finding");
    expect(report.problem).toContain("production_tons");
    expect(report.whatChanged).toBe(finding.description);
    expect(report.confidenceSummary).toContain(evidence.confidence.toUpperCase());
    expect(report.recommendedNextInvestigation.length).toBeGreaterThan(0);
  });

  it("renders markdown containing all required report sections", async () => {
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
    const report = buildReport({ finding, evidence, contributors, economicImpact: null });
    const markdown = reportToMarkdown(report);

    expect(markdown).toContain("## Problem");
    expect(markdown).toContain("## What Changed");
    expect(markdown).toContain("## Evidence");
    expect(markdown).toContain("## Possible Contributors");
    expect(markdown).toContain("## Economic Impact");
    expect(markdown).toContain("## Confidence & Uncertainty");
    expect(markdown).toContain("## Recommended Next Investigation");
  });

  it("shows a clear message when economic impact was never calculated", async () => {
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
    const report = buildReport({ finding, evidence, contributors, economicImpact: null });
    const markdown = reportToMarkdown(report);

    expect(markdown).toContain("has not been calculated");
  });
});
