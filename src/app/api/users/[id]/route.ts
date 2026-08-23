import { NextRequest, NextResponse } from "next/server";
import { db, withRetry } from "@/lib/core";
import { getAuthSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withRetry(async () => {
    db.ensureSchema();
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { masterPassword } = body;

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

    const userIndex = db.users.findIndex((u) => u.id === id);
    if (userIndex === -1) {
      return NextResponse.json({ error: "User account not found." }, { status: 404 });
    }

    const deleted = db.users.splice(userIndex, 1)[0];
    if (typeof db.logActivity === "function") {
      db.logActivity("USER_DELETE", `Administrator account removed: ${deleted.name} (${deleted.email})`, session.user);
    }

    return NextResponse.json({ success: true, deleted });
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withRetry(async () => {
    db.ensureSchema();
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { newPassword, masterPassword } = body;

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

    if (!newPassword || newPassword.length < 4) {
      return NextResponse.json(
        { error: "New password must be at least 4 characters long." },
        { status: 400 }
      );
    }

    const user = db.users.find((u) => u.id === id);
    if (!user) {
      return NextResponse.json({ error: "User account not found." }, { status: 404 });
    }

    user.password = newPassword;
    if (typeof db.logActivity === "function") {
      db.logActivity("PASSWORD_RESET", `Password reset for user: ${user.name} (${user.email})`, session.user);
    }

    return NextResponse.json({
      success: true,
      message: `Password for ${user.name} successfully updated.`,
    });
  });
}