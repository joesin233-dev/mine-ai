// Returns tap-to-ask question suggestions for a dataset, built from its real
// columns. No AI: see core/investigation-engine/suggestQuestions.ts.

import { NextRequest, NextResponse } from "next/server";
import { createStore } from "@/storage/fileStore";
import {
  suggestQuestions,
  askableColumnNames,
} from "@/core/investigation-engine/suggestQuestions";
import type { Dataset } from "@/models/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const datasetId = req.nextUrl.searchParams.get("datasetId");
  if (!datasetId) {
    return NextResponse.json({ error: "datasetId is required" }, { status: 400 });
  }

  const processedStore = createStore<Dataset>("processed");
  const dataset = await processedStore.load(datasetId);
  if (!dataset) {
    return NextResponse.json({ error: "Dataset not found" }, { status: 404 });
  }

  return NextResponse.json({
    suggestions: suggestQuestions(dataset.columns, []),
    columnNames: askableColumnNames(dataset.columns),
  });
}
