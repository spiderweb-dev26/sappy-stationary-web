import { NextRequest, NextResponse } from "next/server";
import { db, withRetry } from "@/lib/core";
import { getAuthSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  return withRetry(async () => {
    db.ensureSchema();
    const session = await getAuthSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    return NextResponse.json(db.expenses);
  });
}

export async function POST(req: NextRequest) {
  return withRetry(async () => {
    db.ensureSchema();
    const session = await getAuthSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const newExpense = {
      id: `exp-${Date.now()}`,
      category: body.category || "General",
      description: body.description || "Stationery shop expense",
      amount: Number(body.amount) || 0,
      date: body.date ? new Date(body.date) : new Date(),
      paymentMethod: body.paymentMethod || "CASH",
      createdBy: session.user?.name || "Staff",
      receiptRef: body.receiptRef || null,
      createdAt: new Date(),
    };

    db.expenses.unshift(newExpense);
    db.logActivity("EXPENSE_CREATE", `Recorded expense ${newExpense.category}: ${newExpense.amount} ETB`, session.user);
    return NextResponse.json(newExpense, { status: 201 });
  });
}
