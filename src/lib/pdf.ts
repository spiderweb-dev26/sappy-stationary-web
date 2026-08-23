import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { InventoryItem, Sale, QrGridPreset } from "./types";
import { drawQrJsPdf } from "./qr";
import { formatCurrency, formatDate, formatDateTime } from "./format";
import { SAPPY_LOGO_BASE64 } from "./logoData";

export function parseGridPreset(grid: string): { cols: number; rows: number } {
  const parts = (grid || "4x3").toLowerCase().split("x");
  const cols = parseInt(parts[0], 10) || 4;
  const rows = parseInt(parts, 10) || 3;
  return { cols, rows };
}

/**
 * Generates an A4 Portrait 2D QR Label Sheet PDF (2x2 to 12x12)
 * NO PRICES ON QR LABELS - Clean Title, Logo, Emerald 2D QR Code & Monospace Serial.
 */
export function generateQrSheetPdf(
  items: InventoryItem[],
  options: { grid?: string; repeatCount?: number } = {}
): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4", // 210 x 297 mm
  });

  const grid = options.grid || "4x3";
  const { cols, rows } = parseGridPreset(grid);
  const pageWidth = 210;
  const pageHeight = 297;
  
  const marginX = 8;
  const marginTop = 10;
  const marginBottom = 14;
  
  const printableWidth = pageWidth - marginX * 2;
  const printableHeight = pageHeight - marginTop - marginBottom;
  
  const cellWidth = printableWidth / cols;
  const cellHeight = printableHeight / rows;
  const itemsPerPage = cols * rows;
  
  const totalPages = Math.ceil(items.length / itemsPerPage) || 1;

  for (let p = 0; p < totalPages; p++) {
    if (p > 0) doc.addPage();

    const pageItems = items.slice(p * itemsPerPage, (p + 1) * itemsPerPage);

    pageItems.forEach((item, index) => {
      const colIdx = index % cols;
      const rowIdx = Math.floor(index / cols);

      const cellX = marginX + colIdx * cellWidth;
      const cellY = marginTop + rowIdx * cellHeight;

      const padding = Math.max(1, Math.min(2.5, cellWidth * 0.04));
      const innerW = cellWidth - padding * 2;
      const innerH = cellHeight - padding * 2;
      const innerX = cellX + padding;
      const innerY = cellY + padding;

      // 1. Draw rounded boundary frame
      doc.setDrawColor(203, 213, 225); // slate-300
      doc.setLineWidth(0.25);
      doc.setFillColor(254, 252, 246); // warm cream
      const cornerRadius = Math.max(1, Math.min(2.5, cellWidth * 0.05));
      doc.roundedRect(innerX, innerY, innerW, innerH, cornerRadius, cornerRadius, "FD");

      const isCompact = cols >= 6 || rows >= 6;
      const isUltraCompact = cols >= 9 || rows >= 9;

      // 2. Header Area: Logo & Item Name (NO PRICE)
      const logoSize = isUltraCompact ? 0 : isCompact ? Math.min(innerW * 0.2, 5) : Math.min(innerW * 0.22, 8);
      const headerTop = innerY + 1.5;

      if (logoSize > 0) {
        try {
          if (SAPPY_LOGO_BASE64) {
            doc.addImage(SAPPY_LOGO_BASE64, "PNG", innerX + innerW - logoSize - 1, headerTop, logoSize, logoSize);
          }
        } catch (e) {}
      }

      // Title text (NO PRICE)
      const textMaxW = logoSize > 0 ? innerW - logoSize - 2.5 : innerW - 2;
      let textBottom = headerTop;

      if (!isUltraCompact) {
        const titleSize = isCompact ? 4.5 : Math.min(7.5, cellWidth * 0.15);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(titleSize);
        doc.setTextColor(15, 23, 42); // slate-900

        const lines = doc.splitTextToSize(item.name || "Stationery Item", textMaxW);
        const displayLines = lines.slice(0, isCompact ? 1 : 2);
        
        displayLines.forEach((line: string) => {
          doc.text(line, innerX + 1.5, textBottom + titleSize * 0.35);
          textBottom += titleSize * 0.35 + 0.6;
        });
      }

      // 3. Centered Square 2D QR Code in Emerald Green (#064e3b)
      const reservedBottom = isUltraCompact ? 3.5 : isCompact ? 5.5 : 8;
      const availableQrH = innerH - (textBottom - innerY) - reservedBottom;
      const availableQrW = innerW - 3;
      
      const qrSize = Math.max(5, Math.min(availableQrW, availableQrH, 46));

      const qrX = innerX + (innerW - qrSize) / 2;
      const qrY = textBottom + Math.max(0.5, (availableQrH - qrSize) / 2);

      const serialToEncode = item.serial || item.sku || `SL-26-${item.id.slice(-5).toUpperCase()}`;
      drawQrJsPdf(doc, serialToEncode, qrX, qrY, qrSize, { r: 6, g: 78, b: 59 });

      // 4. Monospace Serial Code Below QR
      const serialFontSize = isUltraCompact ? 3.5 : isCompact ? 4.5 : Math.min(7, cellWidth * 0.13);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(serialFontSize);
      doc.setTextColor(4, 120, 87); // emerald-700
      
      const serialY = Math.min(innerY + innerH - 1, qrY + qrSize + serialFontSize * 0.4 + 1);
      doc.text(serialToEncode, innerX + innerW / 2, serialY, { align: "center" });
    });

    // 5. Branded Footer Line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(marginX, pageHeight - 10, pageWidth - marginX, pageHeight - 10);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    const footerText = `Sappy Stationary * 2D QR Code Sheet (${cols}x${rows}) * Total Labels: ${items.length} * Page ${p + 1} of ${totalPages}`;
    doc.text(footerText, pageWidth / 2, pageHeight - 5.5, { align: "center" });
  }

  return doc;
}

export { generateQrSheetPdf as generateBarcodeSheetPdf };

/**
 * Generates Landscape Inventory Ledger PDF
 */
export function generateInventoryLedgerPdf(
  items: InventoryItem[],
  reportTitle: string = "Inventory Ledger Report"
): jsPDF {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 297;
  const pageHeight = 210;

  doc.setFillColor(6, 78, 59);
  doc.rect(0, 0, pageWidth, 24, "F");

  try {
    if (SAPPY_LOGO_BASE64) {
      doc.addImage(SAPPY_LOGO_BASE64, "PNG", 12, 3.5, 17, 17);
    }
  } catch (e) {}

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text("SAPPY STATIONARY", 33, 11);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(167, 243, 208);
  doc.text(reportTitle.toUpperCase(), 33, 17.5);

  const dateStr = `Generated: ${new Date().toLocaleDateString()} | Total Items: ${items.length}`;
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(dateStr, pageWidth - 14, 14, { align: "right" });

  let totalUnits = 0;
  let totalCostValue = 0;
  let totalRetailValue = 0;

  const tableData = items.map((item, idx) => {
    totalUnits += item.quantity || 0;
    const itemCost = item.costUnknown ? 0 : (item.costPrice || 0) * (item.quantity || 0);
    const itemRetail = (item.sellingPrice || 0) * (item.quantity || 0);
    totalCostValue += itemCost;
    totalRetailValue += itemRetail;

    return [
      idx + 1,
      item.serial || "-",
      item.name || "-",
      item.category || "General",
      item.quantity || 0,
      item.unit || "pcs",
      item.costUnknown ? "Unknown" : formatCurrency(item.costPrice),
      formatCurrency(item.sellingPrice),
      formatCurrency(itemRetail),
      item.location || "-",
    ];
  });

  autoTable(doc, {
    startY: 28,
    margin: { left: 12, right: 12, bottom: 18 },
    head: [
      ["#", "QR Serial", "Item Name", "Category", "Qty", "Unit", "Cost (ETB)", "Selling (ETB)", "Stock Value", "Location"]
    ],
    body: tableData,
    foot: [
      [
        "TOTAL",
        "",
        `Items in View: ${items.length}`,
        "",
        totalUnits.toString(),
        "units",
        formatCurrency(totalCostValue),
        "",
        formatCurrency(totalRetailValue),
        ""
      ]
    ],
    theme: "striped",
    headStyles: {
      fillColor: "#047857",
      textColor: "#ffffff",
      fontStyle: "bold",
      fontSize: 8.5,
    },
    footStyles: {
      fillColor: "#064e3b",
      textColor: "#ffffff",
      fontStyle: "bold",
      fontSize: 8.5,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: "#0f172a",
    },
  });

  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(12, pageHeight - 10, pageWidth - 12, pageHeight - 10);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Sappy Stationary * Official Inventory Ledger * Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 5,
      { align: "center" }
    );
  }

  return doc;
}

/**
 * Generates thermal sales receipt with 2D QR code
 */
export function generateReceiptPdf(sale: Sale, storeName: string = "Sappy Stationary"): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [80, 200],
  });

  const pw = 80;
  let y = 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(4, 120, 87);
  doc.text(storeName.toUpperCase(), pw / 2, y, { align: "center" });

  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text("Premium Stationery & Office Supplies", pw / 2, y, { align: "center" });

  y += 4;
  doc.text(`Receipt: ${sale.receiptNo}`, pw / 2, y, { align: "center" });
  y += 3.5;
  doc.text(`Date: ${formatDateTime(sale.createdAt)}`, pw / 2, y, { align: "center" });

  y += 4;
  doc.setDrawColor(203, 213, 225);
  doc.line(6, y, pw - 6, y);

  y += 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text("Item", 6, y);
  doc.text("Qty x Price", 45, y);
  doc.text("Total", pw - 6, y, { align: "right" });

  y += 3.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);

  sale.items.forEach((line) => {
    const name = line.item?.name || line.itemName || "Stationery Item";
    const shortName = name.length > 20 ? name.substring(0, 18) + "..." : name;
    doc.text(shortName, 6, y);
    doc.text(`${line.quantity} x ${line.unitPrice.toFixed(2)}`, 45, y);
    doc.text(line.subtotal.toFixed(2), pw - 6, y, { align: "right" });
    y += 4;
  });

  y += 2;
  doc.line(6, y, pw - 6, y);

  y += 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Grand Total:", 6, y);
  doc.text(formatCurrency(sale.totalAmount), pw - 6, y, { align: "right" });

  y += 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Payment:", 6, y);
  doc.text(sale.paymentMethod, pw - 6, y, { align: "right" });

  if (sale.status === "REFUNDED") {
    y += 5;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(220, 38, 38);
    doc.text("*** VOIDED / REFUNDED ***", pw / 2, y, { align: "center" });
    doc.setTextColor(15, 23, 42);
  }

  y += 6;
  const qrSize = 22;
  drawQrJsPdf(doc, sale.receiptNo, (pw - qrSize) / 2, y, qrSize, { r: 6, g: 78, b: 59 });
  
  y += qrSize + 4;
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text("Thank you for shopping at Sappy Stationary!", pw / 2, y, { align: "center" });

  return doc;
}