"use client";

import React, { useState } from "react";
import { UploadCloud, FileSpreadsheet, X, CheckCircle2, AlertTriangle } from "lucide-react";
import * as XLSX from "xlsx";
import { generateInventoryTemplateExcel } from "@/lib/excel";
import ProgressBar from "@/components/ProgressBar";
import { InventoryItem } from "@/lib/types";

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (count: number, items?: InventoryItem[]) => void;
}

function findColValue(row: any, aliases: string[]): any {
  const keys = Object.keys(row);
  for (const a of aliases) {
    const matchKey = keys.find((k) => k.trim().toLowerCase() === a.toLowerCase());
    if (matchKey !== undefined && row[matchKey] !== undefined && row[matchKey] !== null && String(row[matchKey]).trim() !== "") {
      return row[matchKey];
    }
  }
  return undefined;
}

export default function ImportModal({
  isOpen,
  onClose,
  onSuccess,
}: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedItems, setParsedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    try {
      const data = await selected.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json: any[] = XLSX.utils.sheet_to_json(worksheet);

      if (json.length === 0) {
        setError("The uploaded spreadsheet contains no data rows.");
        return;
      }

      const normalized = json.map((row) => {
        const name = findColValue(row, ["item name", "item", "name", "title", "product", "description", "item_name", "product name"]) || "";
        const quantity = Number(findColValue(row, ["quantity", "qty", "stock", "units", "count", "amount", "pcs"]) || 0);
        const costPrice = Number(findColValue(row, ["cost price", "cost", "buying price", "purchase price", "unit cost", "buy price"]) || 0);
        const sellingPrice = Number(findColValue(row, ["selling price", "sell price", "selling", "price", "unit price", "sell", "retail price"]) || 0);
        const category = findColValue(row, ["category", "dept", "group", "type", "section"]) || "General Stationery";
        const unit = findColValue(row, ["unit", "unit of measure", "uom"]) || "pcs";
        const location = findColValue(row, ["location", "shelf", "bay", "rack", "aisle", "bin"]) || "";
        const supplier = findColValue(row, ["supplier", "vendor", "distributor", "source"]) || "";
        const notes = findColValue(row, ["notes", "note", "comment", "remarks", "description"]) || "Imported via Excel";

        return {
          name,
          quantity,
          costPrice,
          sellingPrice,
          category,
          unit,
          location,
          supplier,
          notes,
        };
      }).filter((it) => it.name && it.name.trim().length > 0);

      if (normalized.length === 0) {
        setError("No valid item names found in columns. Please ensure a column named 'Item Name' or 'Name' exists.");
        return;
      }

      setParsedItems(normalized);
    } catch (err: any) {
      setError("Failed to parse Excel file: " + err.message);
    }
  };

  const handleDownloadTemplate = () => {
    const buffer = generateInventoryTemplateExcel();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sappy-inventory-import-template.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    if (!parsedItems || parsedItems.length === 0) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/inventory/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: parsedItems }),
      });

      let data: any = {};
      const resText = await res.text();
      try {
        data = resText ? JSON.parse(resText) : {};
      } catch (jsonErr) {
        data = { count: parsedItems.length };
      }

      if (!res.ok) {
        throw new Error(data.error || "Batch import failed.");
      }

      onSuccess(data.count || parsedItems.length, data.items || []);
      onClose();
    } catch (err: any) {
      setError("Import error: " + err.message);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-6 sm:p-7 border border-slate-200 animate-scale-up space-y-4">
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-black text-lg text-slate-900 leading-tight">
                Import Inventory Spreadsheet
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Bulk upload items from Excel (.xlsx, .xls) or CSV with automatic serials.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="py-8">
            <ProgressBar label={`Importing ${parsedItems.length} items into inventory...`} durationMs={500} />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-3xl p-6 text-center transition-colors bg-slate-50/50">
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
                id="excel-upload-input"
              />
              <label
                htmlFor="excel-upload-input"
                className="cursor-pointer flex flex-col items-center justify-center"
              >
                <UploadCloud className="w-10 h-10 text-emerald-600 mb-2" />
                <span className="text-sm font-bold text-slate-800">
                  {file ? file.name : "Click to select Excel (.xlsx, .xls) or CSV"}
                </span>
                <span className="text-xs text-slate-400 mt-1">
                  Auto-detects Item Name, Quantity, Cost & Selling Prices
                </span>
              </label>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Need the standard template?</span>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="font-bold text-emerald-700 hover:underline"
              >
                Download Starter Excel Template
              </button>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {parsedItems.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Detected {parsedItems.length} Valid Items:</span>
                  <span className="text-emerald-700">Ready to import</span>
                </div>
                <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-2xl text-xs bg-slate-50/50">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-slate-700 sticky top-0 font-bold">
                      <tr>
                        <th className="p-2.5">Item Name</th>
                        <th className="p-2.5">Qty</th>
                        <th className="p-2.5">Cost</th>
                        <th className="p-2.5">Selling</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {parsedItems.slice(0, 10).map((r, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="p-2 font-medium">{r.name}</td>
                          <td className="p-2">{r.quantity} {r.unit}</td>
                          <td className="p-2">ETB {r.costPrice}</td>
                          <td className="p-2 font-bold text-emerald-800">ETB {r.sellingPrice}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {parsedItems.length > 10 && (
                  <p className="text-[10px] text-slate-400 text-center">
                    + {parsedItems.length - 10} more items will be imported simultaneously
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={parsedItems.length === 0 || loading}
                onClick={handleImport}
                className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-md shadow-emerald-700/20 disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Confirm & Import ({parsedItems.length}) Items</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}