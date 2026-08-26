// MINE AI V0.1 — Upload route
// Stage 1 scope: accept a CSV/XLSX file, save it untouched to /data/uploads,
// and record a minimal placeholder Dataset entry. Parsing/profiling is Stage 2/3.

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { saveRawUpload, createStore } from "@/storage/fileStore";
import type { Dataset } from "@/models/types";

const ALLOWED_EXTENSIONS = ["csv", "xlsx", "xls"];

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: "No file provided. Upload a CSV or XLSX file." },
      { status: 400 }
    );
  }

  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return NextResponse.json(
      { error: `Unsupported file type ".${extension}". Use CSV or XLSX.` },
      { status: 400 }
    );
  }

  const datasetId = randomUUID();
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  await saveRawUpload(datasetId, buffer, extension);

  // Stage 1 placeholder record — row/column analysis is NOT done here yet.
  // This is intentionally minimal and must not be presented as a completed
  // "understanding" of the data (that's Stage 3).
  const placeholder: Dataset = {
    id: datasetId,
    filename: file.name,
    uploadedAt: new Date().toISOString(),
    rowCount: 0,
    columns: [],
  };

  const processedStore = createStore<Dataset>("processed");
  await processedStore.save(datasetId, placeholder);

  return NextResponse.json({ datasetId, filename: file.name });
}
