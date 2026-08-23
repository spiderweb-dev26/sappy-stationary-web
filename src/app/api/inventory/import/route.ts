import { NextRequest, NextResponse } from "next/server";
import { db, withRetry } from "@/lib/core";
import { getAuthSession } from "@/lib/auth";
import {
  firestore,
  isFirebaseConfigured,
  doc,
  writeBatch,
} from "@/lib/firebase";
import { generateAutoSerial } from "@/lib/format";
import { InventoryItem } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  return withRetry(async () => {
    db.ensureSchema();
    const session = await getAuthSession();

    const body = await req.json().catch(() => ({}));
    const rawItems: any[] = body.items || [];

    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      return NextResponse.json({ error: "No items provided for import." }, { status: 400 });
    }

    const insertedItems: InventoryItem[] = [];
    const timestamp = new Date();

    rawItems.forEach((raw, idx) => {
      const name = (raw.name || "").trim();
      if (!name) return;

      const item: InventoryItem = {
        id: `item-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 5)}`,
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
        notes: raw.notes || "Imported via Excel spreadsheet",
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

    if (isFirebaseConfigured && firestore && insertedItems.length > 0) {
      try {
        const batch = writeBatch(firestore);
        insertedItems.forEach((it) => {
          const itemRef = doc(firestore, "items", it.id);
          batch.set(itemRef, {
            ...it,
            createdAt: it.createdAt.toString(),
            updatedAt: it.updatedAt.toString(),
          });
        });
        await batch.commit();
      } catch (err) {
        console.warn("Firestore batch import warning:", err);
      }
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
  });
}