// Stage 1 stub — report engine arrives in Stage 10. Not implemented.
import { NextResponse } from "next/server";
export async function GET() {
  return NextResponse.json(
    { error: "Report engine not yet implemented (Stage 10)." },
    { status: 501 }
  );
}
