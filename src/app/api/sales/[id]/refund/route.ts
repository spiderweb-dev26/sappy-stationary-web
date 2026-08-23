import { NextRequest, NextResponse } from "next/server";
import { db, withRetry } from "@/lib/core";
import { getAuthSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return withRetry(async () => {
    db.ensureSchema();
    const session = await getAuthSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { masterPassword } = await req.json();
    if (!db.verifyMasterPassword(masterPassword)) {
      return NextResponse.json({ error: "Master safety password required" }, { status: 403 });
    }

    try {
      const updatedSale = db.toggleSaleRefund(params.id, session.user);
      return NextResponse.json({ success: true, sale: updatedSale });
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
  });
}
