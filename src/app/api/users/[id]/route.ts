import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/core";
import { getAuthSession } from "@/lib/auth";
import {
  firestore,
  isFirebaseConfigured,
  collection,
  getDocs,
  withFirestoreTimeout,
} from "@/lib/firebase";
import { User } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (typeof db.ensureSchema === "function") {
      db.ensureSchema();
    }

    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    let userList: User[] = [];

    // 1. Fetch live from Firestore
    if (isFirebaseConfigured && firestore) {
      try {
        const querySnap = await withFirestoreTimeout(
          getDocs(collection(firestore, "users")),
          2500
        );
        if (!querySnap.empty) {
          userList = querySnap.docs.map((d) => d.data() as User);
        }
      } catch (err) {
        console.warn("Firestore fetch users warning:", err);
      }
    }

    // 2. Memory store check
    if (Array.isArray(db.users) && db.users.length > 0) {
      db.users.forEach((u) => {
        if (!userList.some((existing) => existing.email.toLowerCase() === u.email.toLowerCase())) {
          userList.push(u);
        }
      });
    }

    // 3. Current active session user inclusion
    if (userList.length === 0 && session.user) {
      const activeUser: User = {
        id: (session.user as any).id || "usr-active",
        name: session.user.name || "Amanueal Getahun",
        email: session.user.email || "amanuealhailu007@gmail.com",
        role: (session.user as any).role || "ADMIN",
        createdAt: new Date(),
      };
      userList.push(activeUser);
      db.users.push(activeUser);
    }

    // Deduplicate by email
    const seen = new Set<string>();
    const uniqueUsers: User[] = [];
    userList.forEach((u) => {
      const em = (u.email || "").toLowerCase().trim();
      if (em && !seen.has(em)) {
        seen.add(em);
        uniqueUsers.push({
          id: u.id || `usr-${Date.now()}`,
          name: u.name || "Administrator",
          email: em,
          role: u.role || "ADMIN",
          createdAt: u.createdAt || new Date(),
        });
      }
    });

    return NextResponse.json(uniqueUsers);
  } catch (err: any) {
    console.error("GET /api/users error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch users" },
      { status: 500 }
    );
  }
}