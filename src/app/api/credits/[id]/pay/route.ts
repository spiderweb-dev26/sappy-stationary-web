import { NextRequest, NextResponse } from "next/server";
import { db, withRetry } from "@/lib/core";
import { getAuthSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return withRetry(async () => {
    db.ensureSchema();
    const session = await getAuthSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const credit = db.credits.find((c) => c.id === params.id);
    if (!credit) return NextResponse.json({ error: "Credit account not found" }, { status: 404 });

    const { amount, paymentMethod = "CASH", note } = await req.json();
    const payAmount = Number(amount) || 0;
    if (payAmount <= 0) {
      return NextResponse.json({ error: "Valid payment amount required" }, { status: 400 });
    }

    credit.remainingAmount = Math.max(0, credit.remainingAmount - payAmount);
    credit.status = credit.remainingAmount === 0 ? "PAID" : "PARTIALLY_PAID";
    credit.updatedAt = new Date();

    const payment = {
      id: `pay-${Date.now()}`,
      creditId: credit.id,
      amount: payAmount,
      paymentMethod,
      note: note || null,
      createdAt: new Date(),
    };

    if (!credit.payments) credit.payments = [];
    credit.payments.push(payment);

    db.logActivity("CREDIT_PAYMENT", `Recorded payment of ${payAmount} ETB for ${credit.customerName}`, session.user);

    return NextResponse.json({ success: true, credit, payment });
  });
}
