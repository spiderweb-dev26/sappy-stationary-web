import { NextRequest, NextResponse } from "next/server";
import { db, withRetry } from "@/lib/core";
import { getAuthSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return withRetry(async () => {
    db.ensureSchema();
    const session = await getAuthSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const item = db.items.find((it) => it.id === params.id);
    if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });

    return NextResponse.json(item);
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return withRetry(async () => {
    db.ensureSchema();
    const session = await getAuthSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    try {
      // EDIT IS NEVER BLOCKED BY DUPLICATES
      const updated = db.updateInventoryItem(params.id, body, session.user);
      return NextResponse.json(updated);
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
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
      db.deleteInventoryItem(params.id, session.user);
      return NextResponse.json({ success: true });
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
  });
}
