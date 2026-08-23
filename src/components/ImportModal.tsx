"use client";

import React, { useState } from "react";
import { UploadCloud, FileSpreadsheet, X, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import * as XLSX from "xlsx";
import { generateInventoryTemplateExcel } from "@/lib/excel";

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (count: number) => void;
}

export default function ImportModal({
  isOpen,
  onClose,
  onSuccess,
}: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewRows, setPreviewRows] = useState<any[]>([]);
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
      setPreviewRows(json.slice(0, 10)); // preview first 10
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
    if (!file) return;
    setLoading(true);
    setError("");

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json: any[] = XLSX.utils.sheet_to_json(worksheet);

      let successCount = 0;

      // Post each row with allowDuplicate: true so same-name rows are stored and land in Duplicates
      for (const row of json) {
        const name = row["Item Name"] || row["name"] || row["Title"];
        if (!name) continue;

        const body = {
          name,
          category: row["Category"] || row["category"] || "General Stationery",
          quantity: Number(row["Quantity"] || row["quantity"] || 0),
          unit: row["Unit"] || row["unit"] || "pcs",
          costPrice: Number(row["Cost Price"] || row["costPrice"] || 0),
          sellingPrice: Number(row["Selling Price"] || row["sellingPrice"] || 0),
          location: row["Location"] || row["location"] || "",
          supplier: row["Supplier"] || row["supplier"] || "",
          notes: row["Notes"] || row["notes"] || "Imported via Excel",
          allowDuplicate: true, // Key requirement: Excel import posts with allowDuplicate: true
        };

        const res = await fetch("/api/inventory", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (res.ok) successCount++;
      }

      onSuccess(successCount);
      onClose();
    } catch (err: any) {
      setError("Import error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 border border-slate-200 animate-scale-up">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-black text-lg text-slate-900 leading-tight">
                Import Inventory from Excel
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload .xlsx or .xls spreadsheets to bulk-create items with auto serials.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="mt-5 space-y-4">
          <div className="border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-2xl p-6 text-center transition-colors bg-slate-50/50">
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
                {file ? file.name : "Click to choose Excel spreadsheet"}
              </span>
              <span className="text-xs text-slate-400 mt-1">Supports .xlsx, .xls formats</span>
            </label>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Need the official columns format?</span>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="font-bold text-emerald-700 hover:underline"
            >
              Download Excel Starter Template
            </button>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {previewRows.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-700 mb-1.5">
                Preview (First {previewRows.length} Rows):
              </p>
              <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 text-slate-700 sticky top-0">
                    <tr>
                      <th className="p-2">Item Name</th>
                      <th className="p-2">Qty</th>
                      <th className="p-2">Cost</th>
                      <th className="p-2">Selling</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previewRows.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="p-2 font-medium">{r["Item Name"] || r["name"]}</td>
                        <td className="p-2">{r["Quantity"] || r["quantity"] || 0}</td>
                        <td className="p-2">{r["Cost Price"] || r["costPrice"] || 0}</td>
                        <td className="p-2">{r["Selling Price"] || r["sellingPrice"] || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!file || loading}
            onClick={handleImport}
            className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 rounded-xl shadow-md shadow-emerald-700/20 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            Confirm & Import All
          </button>
        </div>
      </div>
    </div>
  );
}
