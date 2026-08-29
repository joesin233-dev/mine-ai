// MINE AI V0.1 — Understand route
// Stage 3 update: returns the full real Dataset profile (column types,
// stats, quality flags) that was computed and saved during upload.

import { NextRequest, NextResponse } from "next/server";
import { createStore } from "@/storage/fileStore";
import type { Dataset } from "@/models/types";

export async function GET(req: NextRequest) {
  const datasetId = req.nextUrl.searchParams.get("datasetId");
  if (!datasetId) {
    return NextResponse.json({ error: "datasetId is required" }, { status: 400 });
  }
  const store = createStore<Dataset>("processed");
  const dataset = await store.load(datasetId);
  if (!dataset) {
    return NextResponse.json({ error: "Dataset not found" }, { status: 404 });
  }
  return NextResponse.json(dataset);
}
