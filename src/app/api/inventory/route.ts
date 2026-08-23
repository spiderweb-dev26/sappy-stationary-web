import { NextRequest, NextResponse } from "next/server";
import { db, withRetry } from "@/lib/core";
import { getAuthSession } from "@/lib/auth";
import { normalizeItemName } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return withRetry(async () => {
    db.ensureSchema();
    db.ensureCols();
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = (searchParams.get("search") || "").trim().toLowerCase();
    const category = searchParams.get("category") || "ALL";
    const lowStock = searchParams.get("lowStock") === "true";
    const tab = searchParams.get("tab") || "all";

    let filtered = [...db.items];

    if (category !== "ALL") {
      filtered = filtered.filter((i) => i.category.toLowerCase() === category.toLowerCase());
    }

    if (lowStock) {
      filtered = filtered.filter((i) => i.quantity <= i.minStock);
    }

    if (search) {
      filtered = filtered.filter(
        (i) =>
          i.name.toLowerCase().includes(search) ||
          i.serial.toLowerCase().includes(search) ||
          (i.sku && i.sku.toLowerCase().includes(search)) ||
          (i.location && i.location.toLowerCase().includes(search))
      );
    }

    const kpis = db.calculateKpis(filtered);
    const duplicates = db.getDuplicatesGrouped();
    const unreviewedCount = db.getUnreviewedDuplicatesCount();

    return NextResponse.json({
      items: filtered,
      kpis,
      duplicates,
      unreviewedCount,
      totalItems: db.items.length,
    });
  });
}

export async function POST(req: NextRequest) {
  return withRetry(async () => {
    db.ensureSchema();
    db.ensureCols();
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, allowDuplicate = false } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Item name is required" }, { status: 400 });
    }

    // Check duplicate if not explicitly allowed
    if (!allowDuplicate) {
      const existing = db.findDuplicateByName(name);
      if (existing) {
        return NextResponse.json(
          {
            error: `Item with name "${name}" is already recorded (Serial: ${existing.serial}). Please edit the existing item.`,
            isDuplicate: true,
            existingSerial: existing.serial,
          },
          { status: 400 }
        );
      }
    }

    try {
      const newItem = db.createInventoryItem(body, allowDuplicate, session.user);
      return NextResponse.json(newItem, { status: 201 });
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
  });
}
