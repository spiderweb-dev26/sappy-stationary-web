import * as XLSX from "xlsx";
import { InventoryItem, Sale } from "./types";
import { formatDate } from "./format";

/**
 * Exports inventory items to Excel workbook buffer
 */
export function exportInventoryToExcel(items: InventoryItem[]): Uint8Array {
  const rows = items.map((item, idx) => ({
    "No": idx + 1,
    "Serial": item.serial || "",
    "Item Name": item.name || "",
    "Category": item.category || "General",
    "Quantity": item.quantity || 0,
    "Unit": item.unit || "pcs",
    "Cost Price (ETB)": item.costUnknown ? "Unknown" : (item.costPrice || 0),
    "Selling Price (ETB)": item.sellingPrice || 0,
    "Total Stock Value (ETB)": (item.sellingPrice || 0) * (item.quantity || 0),
    "Location": item.location || "",
    "Supplier": item.supplier || "",
    "Notes": item.notes || "",
    "Created Date": formatDate(item.createdAt),
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory Ledger");

  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}

/**
 * Exports sales records to Excel workbook buffer
 */
export function exportSalesToExcel(sales: Sale[]): Uint8Array {
  const rows = sales.map((sale, idx) => ({
    "No": idx + 1,
    "Receipt No": sale.receiptNo,
    "Date": formatDate(sale.createdAt),
    "Customer": sale.customerName || "Walk-in",
    "Items Count": sale.items?.length || 0,
    "Total Amount (ETB)": sale.totalAmount,
    "Discount (ETB)": sale.discount,
    "Payment Method": sale.paymentMethod,
    "Status": sale.status,
    "Cashier / Operator": sale.createdBy || "Cashier",
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sales Records");

  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}

/**
 * Generates an inventory import starter Excel template
 */
export function generateInventoryTemplateExcel(): Uint8Array {
  const templateRows = [
    {
      "Item Name": "Pilot G2 0.7mm Gel Pen - Blue",
      "Category": "Writing Instruments",
      "Quantity": 50,
      "Unit": "pcs",
      "Cost Price": 65.0,
      "Selling Price": 95.0,
      "Location": "Shelf A-1",
      "Supplier": "Pilot Stationery",
      "Notes": "Fast moving",
    },
    {
      "Item Name": "Oxford Hardcover Notebook A4 (192 Pages)",
      "Category": "Notebooks & Paper",
      "Quantity": 30,
      "Unit": "pcs",
      "Cost Price": 180.0,
      "Selling Price": 260.0,
      "Location": "Shelf B-2",
      "Supplier": "Oxford Stationery",
      "Notes": "Ruled pages",
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Import Template");

  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}
