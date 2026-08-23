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

    const { currentPassword, newPassword } = await req.json();
    if (!db.verifyMasterPassword(currentPassword)) {
      return NextResponse.json({ error: "Current master password incorrect" }, { status: 403 });
    }

    if (!newPassword || newPassword.length < 4) {
      return NextResponse.json({ error: "Password must be at least 4 characters" }, { status: 400 });
    }

    db.setMasterPassword(newPassword);
    return NextResponse.json({ success: true, message: "Master password updated successfully" });
  });
}
