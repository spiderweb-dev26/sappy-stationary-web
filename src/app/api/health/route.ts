import { NextResponse } from "next/server";
import { db, withRetry } from "@/lib/core";

export const dynamic = "force-dynamic";

export async function GET() {
  return withRetry(async () => {
    db.ensureSchema();
    db.ensureCols();
    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      store: "Sappy Stationary",
      itemsCount: db.items.length,
      salesCount: db.sales.length,
    });
  });
}
