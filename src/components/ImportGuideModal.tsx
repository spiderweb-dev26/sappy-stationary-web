"use client";

import React from "react";
import { FileSpreadsheet, CheckCircle2, X, Download } from "lucide-react";
import { generateInventoryTemplateExcel } from "@/lib/excel";

interface ImportGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ImportGuideModal({ isOpen, onClose }: ImportGuideModalProps) {
  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    const buffer = generateInventoryTemplateExcel();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sappy-inventory-template.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-7 border border-slate-200 animate-scale-up space-y-4">
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-black text-lg text-slate-900 leading-tight">
                Excel Import Guide
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                How to prepare and format your stationery spreadsheet.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-xl hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 text-xs text-slate-600">
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
            <p className="font-bold text-slate-900">Supported Column Headers:</p>
            <ul className="space-y-1 text-[11px] list-disc list-inside text-slate-600">
              <li><strong className="text-slate-800">Item Name</strong> (Required) — e.g. Pilot G2 0.7mm Blue</li>
              <li><strong className="text-slate-800">Category</strong> (Optional) — Writing Instruments, Paper, etc.</li>
              <li><strong className="text-slate-800">Quantity</strong> — Numeric stock count</li>
              <li><strong className="text-slate-800">Cost Price</strong> — Purchase value in ETB</li>
              <li><strong className="text-slate-800">Selling Price</strong> (Required) — Retail price in ETB</li>
              <li><strong className="text-slate-800">Location</strong> — e.g. Shelf A-1</li>
            </ul>
          </div>

          <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200/80 space-y-1">
            <p className="font-bold text-emerald-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              Duplicate Rows are Stored:
            </p>
            <p className="text-[11px] text-emerald-800">
              Same-name rows in your Excel file are safely imported and flagged in the <strong>Duplicates tab</strong> for review.
            </p>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-xl transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Download Starter Template
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-sm"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}