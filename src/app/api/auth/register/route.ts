import { NextRequest, NextResponse } from "next/server";
import { db, withRetry } from "@/lib/core";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  return withRetry(async () => {
    db.ensureSchema();
    const body = await req.json().catch(() => ({}));
    const { name, email, password, masterPasscode } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Full name, email, and password are required." },
        { status: 400 }
      );
    }

    // STRICT SECURITY: Master passcode verification
    if (
      !masterPasscode ||
      (typeof db.verifyMasterPassword === "function"
        ? !db.verifyMasterPassword(masterPasscode)
        : masterPasscode !== "sappy2026")
    ) {
      return NextResponse.json(
        { error: "Invalid Master Passcode. Authorization is strictly required to register an administrator account." },
        { status: 403 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = db.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email address already exists." },
        { status: 400 }
      );
    }

    const newUser = {
      id: `usr-${Date.now()}`,
      name: name.trim(),
      email: cleanEmail,
      password: password,
      role: "ADMIN",
      createdAt: new Date(),
    };

    db.users.push(newUser);
    if (typeof db.logActivity === "function") {
      db.logActivity("USER_REGISTER", `Administrator account registered: ${newUser.name} (${newUser.email})`, { name: newUser.name });
    }

    return NextResponse.json(
      {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
      { status: 201 }
    );
  });
}