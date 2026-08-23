import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/core";
import { getAuthSession } from "@/lib/auth";
import {
  firestore,
  isFirebaseConfigured,
  doc,
  writeBatch,
  withFirestoreTimeout,
} from "@/lib/firebase";
import { generateAutoSerial } from "@/lib/format";
import { InventoryItem } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    if (typeof db.ensureSchema === "function") {
      db.ensureSchema();
    }

    const session = await getAuthSession();

    let body: any = {};
    try {
      body = await req.json();
    } catch (e) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const rawItems: any[] = body.items || [];
    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      return NextResponse.json({ error: "No items found in uploaded file." }, { status: 400 });
    }

    const insertedItems: InventoryItem[] = [];
    const timestamp = new Date();

    // 1. Process all items synchronously into store
    rawItems.forEach((raw, idx) => {
      const name = (raw.name || "").trim();
      if (!name) return;

      const item: InventoryItem = {
        id: `item-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        name,
        serial: raw.serial || generateAutoSerial("26"),
        sku: raw.sku || null,
        category: raw.category || "General Stationery",
        unit: raw.unit || "pcs",
        quantity: Math.max(0, Number(raw.quantity) || 0),
        minStock: Math.max(0, Number(raw.minStock) || 5),
        costPrice: Math.max(0, Number(raw.costPrice) || 0),
        sellingPrice: Math.max(0, Number(raw.sellingPrice) || 0),
        costUnknown: Boolean(raw.costUnknown),
        supplier: raw.supplier || null,
        location: raw.location || null,
        notes: raw.notes || "Imported via Excel",
        dupKeptAt: null,
        dupKeptBy: null,
        userId: session?.user ? (session.user as any).id : null,
        userName: session?.user ? session.user.name || "Amanueal Getahun" : "Store Administrator",
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      db.items.unshift(item);
      insertedItems.push(item);
    });

    // 2. Asynchronous chunked write to Firestore with timeout guard (never blocks HTTP response)
    if (isFirebaseConfigured && firestore && insertedItems.length > 0) {
      (async () => {
        try {
          const chunkSize = 100;
          for (let i = 0; i < insertedItems.length; i += chunkSize) {
            const chunk = insertedItems.slice(i, i + chunkSize);
            const batch = writeBatch(firestore);
            chunk.forEach((it) => {
              const itemRef = doc(firestore, "items", it.id);
              batch.set(itemRef, {
                ...it,
                createdAt: it.createdAt.toString(),
                updatedAt: it.updatedAt.toString(),
              });
            });
            await withFirestoreTimeout(batch.commit(), 2000);
          }
        } catch (err) {
          console.warn("Firestore batch write non-blocking warning:", err);
        }
      })().catch(() => {});
    }

    if (typeof db.logActivity === "function") {
      db.logActivity(
        "IMPORT_EXCEL",
        `Imported ${insertedItems.length} inventory items via spreadsheet`,
        session?.user
      );
    }

    return NextResponse.json({
      success: true,
      count: insertedItems.length,
      items: insertedItems,
    });
  } catch (err: any) {
    console.error("Batch import error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to process import." },
      { status: 500 }
    );
  }
}