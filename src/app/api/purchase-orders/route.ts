import { NextRequest, NextResponse } from "next/server";
import { db, withRetry } from "@/lib/core";
import { getAuthSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  return withRetry(async () => {
    db.ensureSchema();
    const session = await getAuthSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    return NextResponse.json(db.purchaseOrders);
  });
}

export async function POST(req: NextRequest) {
  return withRetry(async () => {
    db.ensureSchema();
    const session = await getAuthSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const poNumber = `PO-26-${Math.floor(1000 + Math.random() * 9000)}`;

    const items = (body.items || []).map((i: any) => {
      const it = db.items.find((x) => x.id === i.itemId);
      const qty = Number(i.quantity) || 1;
      const unitCost = Number(i.unitCost) || (it ? it.costPrice : 0);
      return {
        id: `poi-${Date.now()}-${Math.random()}`,
        itemId: i.itemId,
        item: it,
        quantity: qty,
        unitCost,
        subtotal: qty * unitCost,
      };
    });

    const totalCost = items.reduce((sum: number, it: any) => sum + it.subtotal, 0);

    const newPO = {
      id: `po-${Date.now()}`,
      poNumber,
      supplier: body.supplier || "Supplier",
      status: "ORDERED",
      totalCost,
      orderDate: new Date(),
      expectedDate: body.expectedDate ? new Date(body.expectedDate) : null,
      receivedDate: null,
      notes: body.notes || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      items,
    };

    db.purchaseOrders.unshift(newPO);
    db.logActivity("PO_CREATE", `Created PO ${newPO.poNumber} for ${newPO.supplier}`, session.user);

    return NextResponse.json(newPO, { status: 201 });
  });
}
