import { NextRequest, NextResponse } from "next/server";
import { db, withRetry } from "@/lib/core";
import { getAuthSession } from "@/lib/auth";
import { generateQrSheetPdf } from "@/lib/pdf";
import { QrGridPreset } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  return withRetry(async () => {
    db.ensureSchema();
    const session = await getAuthSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const grid: QrGridPreset = body.grid || "4x3";
    const itemIds: string[] = body.itemIds || [];
    const repeatCount: number = Math.max(1, body.repeatCount || 1);

    let selectedItems = db.items;
    if (itemIds.length > 0) {
      selectedItems = db.items.filter((it) => itemIds.includes(it.id));
    }

    // Expand items if repeat requested
    const finalItems = [];
    for (let r = 0; r < repeatCount; r++) {
      for (const it of selectedItems) {
        finalItems.push(it);
      }
    }

    const pdfDoc = generateQrSheetPdf(finalItems, { grid });
    const pdfBuffer = Buffer.from(pdfDoc.output("arraybuffer"));

    db.logActivity("QR_SHEET_GENERATE", `Generated QR Sheet (${grid}) for ${finalItems.length} labels`, session.user);

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="sappy-qr-sheet-${grid}.pdf"`,
      },
    });
  });
}
