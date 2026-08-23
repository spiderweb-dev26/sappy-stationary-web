"use client";

import React, { useState } from "react";
import { Barcode, Download, Printer, X, Loader2, Grid } from "lucide-react";
import { InventoryItem } from "@/lib/types";
import { generateBarcodeSheetPdf } from "@/lib/pdf";

interface BarcodeSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  singleItem?: InventoryItem | null;
}

const BARCODE_GRIDS = [
  { label: "2 x 5", value: "2x5", desc: "10 large price stickers" },
  { label: "3 x 8", value: "3x8", desc: "24 standard retail labels (Recommended)" },
  { label: "4 x 10", value: "4x10", desc: "40 compact stationery barcodes" },
  { label: "5 x 12", value: "5x12", desc: "60 pen & pencil mini tags" },
];

export default function BarcodeSheetModal({
  isOpen,
  onClose,
  items,
  singleItem,
}: BarcodeSheetModalProps) {
  const [selectedGrid, setSelectedGrid] = useState("3x8");
  const [repeatCount, setRepeatCount] = useState<number>(singleItem ? 24 : 1);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const targetItems = singleItem ? [singleItem] : items;

  const handleGenerate = async (action: "download" | "print") => {
    setLoading(true);
    try {
      const fullList: InventoryItem[] = [];
      for (let r = 0; r < repeatCount; r++) {
        for (const it of targetItems) {
          fullList.push(it);
        }
      }

      const doc = generateBarcodeSheetPdf(fullList, { grid: selectedGrid });
      if (action === "download") {
        doc.save(`sappy-barcodes-${selectedGrid}.pdf`);
      } else {
        doc.autoPrint();
        const blobUrl = doc.output("bloburl");
        window.open(blobUrl, "_blank");
      }
      onClose();
    } catch (e) {
      console.error(e);
      alert("Failed to generate barcode sheet");
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
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200 font-bold">
              <Barcode className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display font-black text-lg text-slate-900 leading-tight">
                {singleItem ? `Barcode Sticker: ${singleItem.name}` : "Print Barcode Sheet (A4)"}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Generate crisp 1D Code 128 barcode stickers with shop logo, item names & prices.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Grid className="w-3.5 h-3.5 text-emerald-600" /> Choose Barcode Grid Layout (A4 Portrait)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {BARCODE_GRIDS.map((g) => (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => setSelectedGrid(g.value)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedGrid === g.value
                      ? "border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20 font-bold"
                      : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium"
                  }`}
                >
                  <div className="font-display font-black text-sm">{g.label}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{g.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Repeat Copies per Item
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="1"
                max="500"
                value={repeatCount}
                onChange={(e) => setRepeatCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-28 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800"
              />
              <span className="text-xs text-slate-500">
                Total stickers: <strong className="text-slate-800">{targetItems.length * repeatCount}</strong>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-slate-100">
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl">
            Cancel
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => handleGenerate("print")}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
          >
            <Printer className="w-3.5 h-3.5" />
            Direct Print
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => handleGenerate("download")}
            className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-md"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            Download PDF
          </button>
        </div>
      </div>
    </div>
  );
}
