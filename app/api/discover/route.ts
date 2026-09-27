// MINE AI V0.1 — Discover route
// Stage 4: runs the discovery engine against an already-uploaded dataset.
// Re-parses the raw file (kept for audit trail since Stage 1) rather than
// storing full row data long-term, per the locked storage architecture.
// Large files are capped to a fast default scan unless the caller
// explicitly asks for a full scan (fullScan: true).

import { NextRequest, NextResponse } from "next/server";
import { createStore, loadRawUpload } from "@/storage/fileStore";
import { parseFile } from "@/core/data-engine/parser";
import { runDiscovery } from "@/core/discovery-engine/discover";
import type { Dataset, Finding } from "@/models/types";

const ROW_LIMIT = 1000; // fast default scan size for large files

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { datasetId, fullScan } = body;

  if (!datasetId) {
    return NextResponse.json({ error: "datasetId is required" }, { status: 400 });
  }

  const processedStore = createStore<Dataset>("processed");
  const dataset = await processedStore.load(datasetId);

  if (!dataset) {
    return NextResponse.json({ error: "Dataset not found" }, { status: 404 });
  }

  const extension = dataset.filename.split(".").pop()?.toLowerCase() ?? "csv";

  let buffer;
  try {
    buffer = await loadRawUpload(datasetId, extension);
  } catch {
    return NextResponse.json(
      { error: "The original uploaded file could not be found." },
      { status: 500 }
    );
  }

  const parseResult = parseFile(buffer, extension);
  const totalRows = parseResult.rows.length;

  const shouldTruncate = !fullScan && totalRows > ROW_LIMIT;
  const rowsToScan = shouldTruncate
    ? parseResult.rows.slice(0, ROW_LIMIT)
    : parseResult.rows;

  const findings = runDiscovery({
    datasetId,
    dataset,
    rows: rowsToScan,
  });

  const findingsStore = createStore<Finding>("findings");
  for (const finding of findings) {
    await findingsStore.save(finding.id, finding);
  }

  return NextResponse.json({
    findings,
    truncated: shouldTruncate,
    totalRows,
    scannedRows: rowsToScan.length,
  });
}
