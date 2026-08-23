import { NextRequest, NextResponse } from "next/server";
import { db, withRetry } from "@/lib/core";
import { getAuthSession } from "@/lib/auth";
import { exportInventoryToExcel } from "@/lib/excel";
import { generateInventoryLedgerPdf } from "@/lib/pdf";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return withRetry(async () => {
    db.ensureSchema();
    const session = await getAuthSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "excel";

    if (format === "pdf") {
      const pdfDoc = generateInventoryLedgerPdf(db.items, "Official Inventory Stock Ledger");
      const pdfBuffer = Buffer.from(pdfDoc.output("arraybuffer"));
      return new NextResponse(pdfBuffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="sappy-inventory-ledger-${Date.now()}.pdf"`,
        },
      });
    }

    const excelBuffer = exportInventoryToExcel(db.items);
    return new NextResponse(Buffer.from(excelBuffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="sappy-inventory-${Date.now()}.xlsx"`,
      },
    });
  });
}
