// MINE AI V0.1 — Upload route
// Stage 3 update: the uploaded file is now fully profiled — real column
// types, statistics, and quality flags — instead of the Stage 2 placeholder
// that only recorded column names with type "unknown".

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { saveRawUpload, createStore } from "@/storage/fileStore";
import { parseFile } from "@/core/data-engine/parser";
import { validateParseResult } from "@/core/data-engine/validator";
import { profileDataset } from "@/core/data-engine/profiler";
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

  // Stage 3: full profiling — real column types, stats, and quality flags.
  const dataset: Dataset = profileDataset(datasetId, file.name, parseResult);

  const processedStore = createStore<Dataset>("processed");
  await processedStore.save(datasetId, dataset);

  return NextResponse.json({
    datasetId,
    filename: file.name,
    rowCount: dataset.rowCount,
    columns: dataset.columns,
  });
}
