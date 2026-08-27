// MINE AI V0.1 — Upload route
// Stage 2 update: the file is now actually parsed and validated on upload.
// Full statistical profiling (column types, stats, quality flags) is still
// Stage 3 — this stage only gets us from "raw file" to "validated rows."

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { saveRawUpload, createStore } from "@/storage/fileStore";
import { parseFile } from "@/core/data-engine/parser";
import { validateParseResult } from "@/core/data-engine/validator";
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

  let parseResult;
  try {
    parseResult = parseFile(buffer, extension);
  } catch (err: any) {
    return NextResponse.json(
      { error: `Could not read the file: ${err.message}` },
      { status: 400 }
    );
  }

  const validation = validateParseResult(parseResult);
  if (!validation.valid) {
    return NextResponse.json(
      {
        error: "The file has structural problems and cannot be used.",
        issues: validation.issues,
      },
      { status: 400 }
    );
  }

  // Stage 2: we now know the real row/column count and header names.
  // Full column typing and statistics (Stage 3) still show empty columns here.
  const dataset: Dataset = {
    id: datasetId,
    filename: file.name,
    uploadedAt: new Date().toISOString(),
    rowCount: parseResult.rowCount,
    columns: parseResult.headers.map((name) => ({
      name,
      type: "unknown",
      missingCount: 0,
      duplicateFlag: false,
      qualityIssues: [],
    })),
  };

  const processedStore = createStore<Dataset>("processed");
  await processedStore.save(datasetId, dataset);

  return NextResponse.json({
    datasetId,
    filename: file.name,
    rowCount: dataset.rowCount,
    headers: parseResult.headers,
  });
}
