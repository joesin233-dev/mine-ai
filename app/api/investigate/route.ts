// Stage 1 stub — investigation engine arrives in Stage 5. Not implemented.
import { NextResponse } from "next/server";
export async function POST() {
  return NextResponse.json(
    { error: "Investigation engine not yet implemented (Stage 5)." },
    { status: 501 }
  );
}
