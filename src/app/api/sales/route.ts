import { NextRequest, NextResponse } from "next/server";
import { db, withRetry } from "@/lib/core";
import { getAuthSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return withRetry(async () => {
    db.ensureSchema();
    const session = await getAuthSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    return NextResponse.json({
      sales: db.sales,
      totalSalesCount: db.sales.length,
      grossRevenue: db.sales
        .filter((s) => s.status === "COMPLETED")
        .reduce((sum, s) => sum + s.totalAmount, 0),
    });
  });
}

export async function POST(req: NextRequest) {
  return withRetry(async () => {
    db.ensureSchema();
    db.ensureCols();
    const session = await getAuthSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: "At least one item is required on the sale ticket" }, { status: 400 });
    }

    try {
      const sale = db.recordSale(body, session.user);
      return NextResponse.json(sale, { status: 201 });
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
  });
}
