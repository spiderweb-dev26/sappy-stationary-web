import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/core";
import { getAuthSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    db.ensureSchema();
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    let body: any = {};
    try {
      body = await req.json();
    } catch (e) {
      return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
    }

    const { mode, masterPassword } = body;

    if (!masterPassword || !db.verifyMasterPassword(masterPassword)) {
      return NextResponse.json(
        { error: "Invalid master password. Authorization rejected." },
        { status: 403 }
      );
    }

    if (mode === "YEAR_END") {
      const result = db.performYearEndReset(session.user);
      return NextResponse.json({
        success: true,
        mode: "YEAR_END",
        message: `Year-end reset complete: Cleared ${result.clearedSales} sales, ${result.clearedExpenses} expenses, ${result.clearedPos} purchase orders. Inventory catalog and customer credits preserved intact.`,
        result,
      });
    } else if (mode === "FULL_RESET") {
      const result = db.performFullReset(session.user);
      return NextResponse.json({
        success: true,
        mode: "FULL_RESET",
        message: "Full clean slate reset complete: All inventory, sales, expenses, and credits have been wiped.",
        result,
      });
    } else {
      return NextResponse.json(
        { error: "Invalid reset mode. Please specify 'YEAR_END' or 'FULL_RESET'." },
        { status: 400 }
      );
    }
  } catch (err: any) {
    console.error("System reset API error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error during reset operation." },
      { status: 500 }
    );
  }
}