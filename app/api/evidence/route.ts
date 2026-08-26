// Stage 1 stub — evidence engine arrives in Stage 7. Not implemented.
import { NextResponse } from "next/server";
export async function GET() {
  return NextResponse.json(
    { error: "Evidence engine not yet implemented (Stage 7)." },
    { status: 501 }
  );
}
