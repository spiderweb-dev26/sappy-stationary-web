import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/core";
import { getAuthSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    if (typeof db.ensureSchema === "function") {
      db.ensureSchema();
    }

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

    // Verify master password
    if (
      !masterPassword ||
      (typeof db.verifyMasterPassword === "function"
        ? !db.verifyMasterPassword(masterPassword)
        : masterPassword !== "sappy2026")
    ) {
      return NextResponse.json(
        { error: "Invalid master password. Authorization rejected." },
        { status: 403 }
      );
    }

    if (mode === "YEAR_END") {
      // 1. Fiscal Year-End Reset: Clears sales, expenses, purchase orders
      const clearedSales = Array.isArray(db.sales) ? db.sales.length : 0;
      const clearedExpenses = Array.isArray(db.expenses) ? db.expenses.length : 0;
      const clearedPos = Array.isArray(db.purchaseOrders) ? db.purchaseOrders.length : 0;

      db.sales = [];
      db.expenses = [];
      db.purchaseOrders = [];
      // INVENTORY ITEMS AND CREDITS ARE PRESERVED INTACT!

      if (typeof db.logActivity === "function") {
        db.logActivity(
          "YEAR_END_RESET",
          `Year-End Fiscal Reset executed: cleared ${clearedSales} sales, ${clearedExpenses} expenses, and ${clearedPos} purchase orders. Inventory catalog and customer credit balances preserved intact.`,
          session.user
        );
      }

      return NextResponse.json({
        success: true,
        mode: "YEAR_END",
        message: `Year-end reset complete: Cleared ${clearedSales} sales, ${clearedExpenses} expenses, ${clearedPos} purchase orders. Inventory catalog and customer credits preserved intact.`,
        result: { clearedSales, clearedExpenses, clearedPos },
      });
    } else if (mode === "FULL_RESET") {
      // 2. Full Clean Slate Factory Reset: Clears everything
      const clearedItems = Array.isArray(db.items) ? db.items.length : 0;
      const clearedSales = Array.isArray(db.sales) ? db.sales.length : 0;
      const clearedCredits = Array.isArray(db.credits) ? db.credits.length : 0;

      db.items = [];
      db.sales = [];
      db.expenses = [];
      db.credits = [];
      db.purchaseOrders = [];
      db.activities = [];

      if (typeof db.logActivity === "function") {
        db.logActivity(
          "FULL_RESET",
          `Full System Clean Slate Reset executed: all ${clearedItems} inventory items, ${clearedSales} sales, expenses, and ${clearedCredits} credit accounts have been wiped.`,
          session.user
        );
      }

      return NextResponse.json({
        success: true,
        mode: "FULL_RESET",
        message: "Full clean slate reset complete: All inventory, sales, expenses, and credits have been wiped.",
        result: { clearedItems, clearedSales, clearedCredits },
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