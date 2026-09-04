// MINE AI V0.1 — Report route
// Stage 10: given a findingId, gathers the finding, evidence, contributors,
// and (if already calculated) economic impact, and returns the full Report
// plus its markdown rendering.

import { NextRequest, NextResponse } from "next/server";
import { createStore, loadRawUpload } from "@/storage/fileStore";
import { parseFile } from "@/core/data-engine/parser";
import { buildEvidence } from "@/core/evidence-engine/evidence";
import { buildReport, reportToMarkdown } from "@/core/report-engine/reportBuilder";
import type { Dataset, Finding, EconomicResult, Report } from "@/models/types";

export async function GET(req: NextRequest) {
  const findingId = req.nextUrl.searchParams.get("findingId");
  if (!findingId) {
    return NextResponse.json({ error: "findingId is required" }, { status: 400 });
  }

  const findingsStore = createStore<Finding>("findings");
  const finding = await findingsStore.load(findingId);
  if (!finding) {
    return NextResponse.json({ error: "Finding not found" }, { status: 404 });
  }

  const processedStore = createStore<Dataset>("processed");
  const dataset = await processedStore.load(finding.datasetId);
  if (!dataset) {
    return NextResponse.json({ error: "Dataset not found" }, { status: 404 });
  }

  const extension = dataset.filename.split(".").pop()?.toLowerCase() ?? "csv";

  let buffer;
  try {
    buffer = await loadRawUpload(finding.datasetId, extension);
  } catch {
    return NextResponse.json(
      { error: "The original uploaded file could not be found." },
      { status: 500 }
    );
  }

  const parseResult = parseFile(buffer, extension);

  const { contributors, evidence } = buildEvidence({ finding, dataset, rows: parseResult.rows });

  const economicStore = createStore<EconomicResult>("economic");
  const economicImpact = await economicStore.load(finding.id);

  const report = buildReport({
    finding,
    evidence,
    contributors,
    economicImpact: economicImpact ?? null,
  });

  const reportsStore = createStore<Report>("reports");
  await reportsStore.save(finding.id, report);

  const markdown = reportToMarkdown(report);

  return NextResponse.json({ report, markdown });
}
