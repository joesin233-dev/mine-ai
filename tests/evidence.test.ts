// MINE AI V0.1 — Evidence route
// Stage 7: given a findingId, loads the finding and its dataset, re-parses
// the raw file, and returns the full contributors + EvidenceRecord.

import { NextRequest, NextResponse } from "next/server";
import { createStore, loadRawUpload } from "@/storage/fileStore";
import { parseFile } from "@/core/data-engine/parser";
import { buildEvidence } from "@/core/evidence-engine/evidence";
import type { Dataset, Finding, EvidenceRecord } from "@/models/types";

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

  const { contributors, evidence } = buildEvidence({
    finding,
    dataset,
    rows: parseResult.rows,
  });

  const evidenceStore = createStore<EvidenceRecord>("evidence");
  await evidenceStore.save(finding.id, evidence);

  return NextResponse.json({ contributors, evidence });
}
