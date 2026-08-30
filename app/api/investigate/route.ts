// MINE AI V0.1 — Investigate route
// Stage 5: runs the investigation engine against a user's free-text
// question about an already-uploaded dataset.

import { NextRequest, NextResponse } from "next/server";
import { createStore, loadRawUpload } from "@/storage/fileStore";
import { parseFile } from "@/core/data-engine/parser";
import { runInvestigation } from "@/core/investigation-engine/investigate";
import type { Dataset, Finding } from "@/models/types";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { datasetId, question } = body;

  if (!datasetId || !question) {
    return NextResponse.json(
      { error: "datasetId and question are both required" },
      { status: 400 }
    );
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

  const result = runInvestigation({
    datasetId,
    dataset,
    rows: parseResult.rows,
    question,
  });

  if (result.needsClarification) {
    return NextResponse.json(
      { needsClarification: true, message: result.clarificationMessage },
      { status: 200 }
    );
  }

  const findingsStore = createStore<Finding>("findings");
  await findingsStore.save(result.finding!.id, result.finding!);

  return NextResponse.json({ needsClarification: false, finding: result.finding });
}
