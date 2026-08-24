import { NextRequest, NextResponse } from "next/server";
import { db, withRetry } from "@/lib/core";
import { getAuthSession } from "@/lib/auth";
import {
  firestore,
  isFirebaseConfigured,
  collection,
  getDocs,
  withFirestoreTimeout,
} from "@/lib/firebase";
import { InventoryItem } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return withRetry(async () => {
    if (typeof db.ensureSchema === "function") {
      db.ensureSchema();
    }
    const session = await getAuthSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "ALL";
    const lowStockOnly = searchParams.get("lowStock") === "true";

    // 1. Live Firestore synchronization
    if (isFirebaseConfigured && firestore) {
      try {
        const querySnap = await withFirestoreTimeout(
          getDocs(collection(firestore, "items")),
          2500
        );
        if (!querySnap.empty) {
          const cloudItems = querySnap.docs.map((d) => d.data() as InventoryItem);
          db.items = cloudItems;
        }
      } catch (err) {
        console.warn("Firestore items sync warning:", err);
      }
    }

    let filtered = [...db.items];

    if (search) {
      const s = search.toLowerCase().trim();
      filtered = filtered.filter(
        (it) =>
          it.name.toLowerCase().includes(s) ||
          it.serial.toLowerCase().includes(s) ||
          (it.sku && it.sku.toLowerCase().includes(s)) ||
          it.category.toLowerCase().includes(s) ||
          (it.location && it.location.toLowerCase().includes(s))
      );
    }

    if (category !== "ALL") {
      filtered = filtered.filter((it) => it.category === category);
    }

    if (lowStockOnly) {
      filtered = filtered.filter((it) => it.quantity <= it.minStock);
    }

    const kpis = db.calculateKpis(filtered);
    const duplicates = db.getDuplicatesGrouped();
    const unreviewedCount = db.getUnreviewedDuplicatesCount();

    return NextResponse.json({
      items: filtered,
      kpis,
      duplicates,
      unreviewedCount,
    });
  });
}

export async function POST(req: NextRequest) {
  return withRetry(async () => {
    db.ensureSchema();
    const session = await getAuthSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { name, allowDuplicate } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Item name is required." }, { status: 400 });
    }

    if (!allowDuplicate) {
      const existing = db.items.find(
        (i) => i.name.toLowerCase().trim() === name.toLowerCase().trim()
      );
      if (existing) {
        return NextResponse.json(
          {
            error: `Item with this name is already recorded (Serial: ${existing.serial}). Please edit the existing item or import via Excel.`,
          },
          { status: 409 }
        );
      }
    }

    const newItem = await db.createInventoryItem(body, allowDuplicate, session.user);
    return NextResponse.json(newItem, { status: 201 });
  });
}