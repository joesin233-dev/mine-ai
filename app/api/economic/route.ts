// MINE AI V0.1 — Economic route
// Stage 8: given a findingId and user-supplied inputs (e.g. valuePerUnit),
// returns the calculated economic impact — or a clear list of what's
// missing if the calculation can't be completed yet.

import { NextRequest, NextResponse } from "next/server";
import { createStore, loadRawUpload } from "@/storage/fileStore";
import { parseFile } from "@/core/data-engine/parser";
import { calculateEconomicImpact } from "@/core/economic-engine/impactCalculator";
import type { Dataset, Finding, EconomicResult } from "@/models/types";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { findingId, inputs } = body;

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

  const result = calculateEconomicImpact({
    finding,
    dataset,
    rows: parseResult.rows,
    providedInputs: inputs ?? {},
  });

  const economicStore = createStore<EconomicResult>("economic");
  await economicStore.save(finding.id, result);

  return NextResponse.json(result);
}
