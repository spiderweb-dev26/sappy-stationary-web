import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { InventoryItem, Sale } from "./types";
import { drawBarcodeJsPdf } from "./barcode";
import { formatCurrency, formatDate, formatDateTime } from "./format";
import { SAPPY_LOGO_BASE64 } from "./logoData";

export function parseGridPreset(grid: string): { cols: number; rows: number } {
  const parts = (grid || "3x8").toLowerCase().split("x");
  const cols = parseInt(parts[0], 10) || 3;
  const rows = parseInt(parts, 10) || 8;
  return { cols, rows };
}

/**
 * Generates an A4 Portrait Barcode Label Sheet PDF (e.g. 3x8, 4x10, 2x5, etc.)
 */
export function generateBarcodeSheetPdf(
  items: InventoryItem[],
  options: { grid?: string; repeatCount?: number } = {}
): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const grid = options.grid || "3x8";
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

      const padding = 2;
      const innerW = cellWidth - padding * 2;
      const innerH = cellHeight - padding * 2;
      const innerX = cellX + padding;
      const innerY = cellY + padding;

      // 1. Draw rounded sticker frame / scissor guide
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.25);
      doc.setFillColor(254, 252, 246);
      doc.roundedRect(innerX, innerY, innerW, innerH, 2, 2, "FD");

      // 2. Shop Logo top-right
      const logoSize = Math.min(innerW * 0.18, 7.5);
      const logoX = innerX + innerW - logoSize - 1.5;
      const logoY = innerY + 1.5;

      try {
        if (SAPPY_LOGO_BASE64) {
          doc.addImage(SAPPY_LOGO_BASE64, "PNG", logoX, logoY, logoSize, logoSize);
        }
      } catch (e) {}

      // 3. Item Name (max 2 lines) & Price badge
      doc.setFont("helvetica", "bold");
      doc.setFontSize(Math.min(8, cellWidth * 0.14));
      doc.setTextColor(15, 23, 42);

      const maxTitleW = innerW - logoSize - 3;
      const lines = doc.splitTextToSize(item.name || "Stationery Item", maxTitleW);
      const displayLines = lines.slice(0, 2);

      let currentY = innerY + 4;
      displayLines.forEach((l: string) => {
        doc.text(l, innerX + 2, currentY);
        currentY += 3.2;
      });

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(4, 120, 87);
      doc.text(formatCurrency(item.sellingPrice), innerX + 2, currentY + 1);

      // 4. 1D Vector Code 128 Barcode
      const serialToEncode = item.serial || item.sku || `SL-26-${item.id.slice(-5).toUpperCase()}`;
      const barcodeW = innerW - 4;
      const barcodeH = Math.max(10, innerH - (currentY - innerY) - 5);
      const barcodeX = innerX + 2;
      const barcodeY = innerY + innerH - barcodeH - 1.5;

      drawBarcodeJsPdf(doc, serialToEncode, barcodeX, barcodeY, barcodeW, barcodeH, {
        showText: true,
        fontSize: Math.min(7, cellWidth * 0.12),
        textColor: [15, 23, 42],
      });
    });

    // 5. Branded Footer Line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(marginX, pageHeight - 10, pageWidth - marginX, pageHeight - 10);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    const footerText = `Sappy Stationary * Barcode Sheet (${cols}x${rows}) * Items: ${items.length} * Page ${p + 1} of ${totalPages} * Date: ${new Date().toLocaleDateString()}`;
    doc.text(footerText, pageWidth / 2, pageHeight - 5.5, { align: "center" });
  }

  return doc;
}

// Backward compatibility alias for QR sheet routes
export { generateBarcodeSheetPdf as generateQrSheetPdf };

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
      ["#", "Barcode Serial", "Item Name", "Category", "Qty", "Unit", "Cost Price", "Selling Price", "Retail Value", "Location"]
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
      fillColor:,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8.5,
    },
    footStyles: {
      fillColor:,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8.5,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [15, 23, 42],
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
 * Generates thermal sales receipt with barcode
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
    const name = line.item?.name || "Stationery Item";
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
  const barcodeW = 56;
  const barcodeH = 14;
  drawBarcodeJsPdf(doc, sale.receiptNo, (pw - barcodeW) / 2, y, barcodeW, barcodeH, {
    showText: true,
    fontSize: 7,
  });
  
  y += barcodeH + 4;
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text("Thank you for shopping at Sappy Stationary!", pw / 2, y, { align: "center" });

  return doc;
}