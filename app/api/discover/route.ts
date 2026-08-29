// Stage 4 test — verifies the discovery engine detects the deliberate
// ~14% production drop and downtime increase baked into the fixture CSV.

import { describe, it, expect } from "vitest";
import { promises as fs } from "fs";
import path from "path";
import { parseCsv } from "../core/data-engine/parser";
import { profileDataset } from "../core/data-engine/profiler";
import { runDiscovery } from "../core/discovery-engine/discover";

describe("discovery engine (Stage 4)", () => {
  it("detects a change in production_tons", async () => {
    const filePath = path.join(process.cwd(), "tests/fixtures/sample-production.csv");
    const buffer = await fs.readFile(filePath);
    const parsed = parseCsv(buffer);
    const dataset = profileDataset("test-id", "sample-production.csv", parsed);

    const findings = runDiscovery({
      datasetId: "test-id",
      dataset,
      rows: parsed.rows,
    });

    const productionChange = findings.find(
      (f) => f.type === "change" && f.variablesInvolved.includes("production_tons")
    );
    expect(productionChange).toBeDefined();
    expect(productionChange!.magnitude).toBeGreaterThan(8);
  });

  it("detects a relationship between downtime_hours and production_tons", async () => {
    const filePath = path.join(process.cwd(), "tests/fixtures/sample-production.csv");
    const buffer = await fs.readFile(filePath);
    const parsed = parseCsv(buffer);
    const dataset = profileDataset("test-id", "sample-production.csv", parsed);

    const findings = runDiscovery({
      datasetId: "test-id",
      dataset,
      rows: parsed.rows,
    });

    const relationship = findings.find(
      (f) =>
        f.type === "relationship" &&
        f.variablesInvolved.includes("downtime_hours") &&
        f.variablesInvolved.includes("production_tons")
    );
    expect(relationship).toBeDefined();
  });

  it("ranks findings from highest to lowest rankScore", async () => {
    const filePath = path.join(process.cwd(), "tests/fixtures/sample-production.csv");
    const buffer = await fs.readFile(filePath);
    const parsed = parseCsv(buffer);
    const dataset = profileDataset("test-id", "sample-production.csv", parsed);

    const findings = runDiscovery({
      datasetId: "test-id",
      dataset,
      rows: parsed.rows,
    });

    for (let i = 0; i < findings.length - 1; i++) {
      expect(findings[i].rankScore).toBeGreaterThanOrEqual(findings[i + 1].rankScore);
    }
  });
});
