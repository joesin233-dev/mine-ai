// Stage 1 stub — discovery engine arrives in Stage 4. Not implemented.
import { NextResponse } from "next/server";
export async function POST() {
  return NextResponse.json(
    { error: "Discovery engine not yet implemented (Stage 4)." },
    { status: 501 }
  );
}
