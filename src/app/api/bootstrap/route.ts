import { NextResponse } from "next/server";
import { db, withRetry } from "@/lib/core";
import { getAuthSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  return withRetry(async () => {
    db.ensureSchema();
    db.ensureCols();
    const session = await getAuthSession();
    return NextResponse.json({
      storeName: db.settings.get("store_name") || "Sappy Stationary",
      currency: db.settings.get("store_currency") || "ETB",
      authenticated: !!session,
      user: session?.user || null,
      masterPasswordSet: true,
      itemsCount: db.items.length,
      unreviewedDuplicates: db.getUnreviewedDuplicatesCount(),
    });
  });
}
