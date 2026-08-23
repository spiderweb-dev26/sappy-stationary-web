import { NextRequest, NextResponse } from "next/server";
import { db, withRetry } from "@/lib/core";
import { getAuthSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return withRetry(async () => {
    db.ensureSchema();
    const session = await getAuthSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const validSales = db.sales.filter((s) => s.status === "COMPLETED");
    const grossRevenue = validSales.reduce((sum, s) => sum + s.totalAmount, 0);

    let totalCogs = 0;
    validSales.forEach((s) => {
      s.items.forEach((line) => {
        const item = db.items.find((i) => i.id === line.itemId);
        if (item && !item.costUnknown) {
          totalCogs += item.costPrice * line.quantity;
        }
      });
    });

    const grossProfit = grossRevenue - totalCogs;
    const totalExpenses = db.expenses.reduce((sum, e) => sum + e.amount, 0);
    const netIncome = grossProfit - totalExpenses;

    const inventoryValuation = db.items.reduce(
      (acc, item) => {
        const q = item.quantity || 0;
        acc.retailValue += (item.sellingPrice || 0) * q;
        if (!item.costUnknown) {
          acc.costValue += (item.costPrice || 0) * q;
        }
        acc.totalUnits += q;
        return acc;
      },
      { retailValue: 0, costValue: 0, totalUnits: 0 }
    );

    return NextResponse.json({
      grossRevenue,
      totalCogs,
      grossProfit,
      totalExpenses,
      netIncome,
      inventoryValuation,
      salesCount: validSales.length,
      itemsCount: db.items.length,
    });
  });
}
