import { NextResponse } from "next/server";
import { db, withRetry } from "@/lib/core";

export const dynamic = "force-dynamic";

export async function GET() {
  return withRetry(async () => {
    db.ensureSchema();
    return NextResponse.json({
      isConfigured: true,
      hint: "Default is sappy2026",
    });
  });
}
