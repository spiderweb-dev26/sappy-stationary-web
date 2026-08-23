import { NextRequest, NextResponse } from "next/server";
import { db, withRetry } from "@/lib/core";
import { getAuthSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return withRetry(async () => {
    db.ensureSchema();
    const session = await getAuthSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const sale = db.sales.find((s) => s.id === params.id);
    if (!sale) return NextResponse.json({ error: "Sale ticket not found" }, { status: 404 });

    return NextResponse.json(sale);
  });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  return withRetry(async () => {
    db.ensureSchema();
    const session = await getAuthSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { masterPassword } = await req.json();
    if (!db.verifyMasterPassword(masterPassword)) {
      return NextResponse.json({ error: "Master safety password required" }, { status: 403 });
    }

    try {
      db.deleteSale(params.id, session.user);
      return NextResponse.json({ success: true, message: "Sale deleted and inventory adjusted" });
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
  });
}
