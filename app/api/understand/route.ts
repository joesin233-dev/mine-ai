// Stage 1 stub — profiling logic arrives in Stage 3.
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
  // Stage 1: returns the placeholder record only. Real column profiling (Stage 3)
  // is not implemented yet — this route must not claim it is.
  return NextResponse.json({ ...dataset, note: "Profiling not yet implemented (Stage 3)." });
}
