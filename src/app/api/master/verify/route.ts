import { NextRequest, NextResponse } from "next/server";
import { db, withRetry } from "@/lib/core";
import { getAuthSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  return withRetry(async () => {
    db.ensureSchema();
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { password } = await req.json();
    const isValid = db.verifyMasterPassword(password);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid master password" }, { status: 403 });
    }

    return NextResponse.json({ success: true, verified: true });
  });
}
