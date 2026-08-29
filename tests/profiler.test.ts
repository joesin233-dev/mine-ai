// Stage 3 test — verifies the profiler computes correct types and statistics
// against the fixture file's known values.

import { describe, it, expect } from "vitest";
import { promises as fs } from "fs";
import path from "path";
import { parseCsv } from "../core/data-engine/parser";
import { profileDataset } from "../core/data-engine/profiler";

describe("profiler (Stage 3)", () => {
  it("detects column types correctly", async () => {
    const filePath = path.join(process.cwd(), "tests/fixtures/sample-production.csv");
    const buffer = await fs.readFile(filePath);
    const parsed = parseCsv(buffer);
    const dataset = profileDataset("test-id", "sample-production.csv", parsed);

    const byName = Object.fromEntries(dataset.columns.map((c) => [c.name, c]));

    expect(byName.date.type).toBe("datetime");
    expect(byName.production_tons.type).toBe("numeric");
    expect(byName.downtime_hours.type).toBe("numeric");
  });

  it("computes correct numeric statistics for production_tons", async () => {
    const filePath = path.join(process.cwd(), "tests/fixtures/sample-production.csv");
    const buffer = await fs.readFile(filePath);
    const parsed = parseCsv(buffer);
    const dataset = profileDataset("test-id", "sample-production.csv", parsed);

    const production = dataset.columns.find((c) => c.name === "production_tons");
    expect(production?.stats).toBeDefined();
    expect(production!.stats!.min).toBe(1010);
    expect(production!.stats!.max).toBe(1215);
  });

  it("reports zero missing values for a clean fixture", async () => {
    const filePath = path.join(process.cwd(), "tests/fixtures/sample-production.csv");
    const buffer = await fs.readFile(filePath);
    const parsed = parseCsv(buffer);
    const dataset = profileDataset("test-id", "sample-production.csv", parsed);

    for (const column of dataset.columns) {
      expect(column.missingCount).toBe(0);
    }
  });

  it("sets the correct row count and dataset id", async () => {
    const filePath = path.join(process.cwd(), "tests/fixtures/sample-production.csv");
    const buffer = await fs.readFile(filePath);
    const parsed = parseCsv(buffer);
    const dataset = profileDataset("abc123", "sample-production.csv", parsed);

    expect(dataset.id).toBe("abc123");
    expect(dataset.rowCount).toBe(14);
  });
});
