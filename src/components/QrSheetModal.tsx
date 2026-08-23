"use client";

import React, { useState } from "react";
import { QrCode, Download, Printer, X, Loader2, Grid } from "lucide-react";
import { InventoryItem, QrGridPreset } from "@/lib/types";
import { generateQrSheetPdf } from "@/lib/pdf";

interface QrSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  singleItem?: InventoryItem | null;
}

const GRID_OPTIONS: { label: string; value: QrGridPreset; desc: string }[] = [
  { label: "2 x 2", value: "2x2", desc: "4 large labels / page" },
  { label: "3 x 3", value: "3x3", desc: "9 standard labels / page" },
  { label: "4 x 3", value: "4x3", desc: "12 labels (Recommended)" },
  { label: "5 x 3", value: "5x3", desc: "15 shelf edge labels" },
  { label: "5 x 4", value: "5x4", desc: "20 price tags / page" },
  { label: "6 x 6", value: "6x6", desc: "36 compact QR stickers" },
  { label: "8 x 8", value: "8x8", desc: "64 small item tags" },
  { label: "9 x 9", value: "9x9", desc: "81 micro QR labels" },
  { label: "10 x 10", value: "10x10", desc: "100 pen/pencil barcode stickers" },
  { label: "12 x 12", value: "12x12", desc: "144 mini stationery tags" },
];

export default function QrSheetModal({
  isOpen,
  onClose,
  items,
  singleItem,
}: QrSheetModalProps) {
  const [selectedGrid, setSelectedGrid] = useState<QrGridPreset>("4x3");
  const [repeatCount, setRepeatCount] = useState<number>(singleItem ? 12 : 1);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const targetItems = singleItem ? [singleItem] : items;

  const handleGeneratePdf = async (action: "download" | "print") => {
    setLoading(true);
    try {
      const fullList: InventoryItem[] = [];
      for (let r = 0; r < repeatCount; r++) {
        for (const it of targetItems) {
          fullList.push(it);
        }
      }

      const doc = generateQrSheetPdf(fullList, { grid: selectedGrid });
      
      if (action === "download") {
        doc.save(`sappy-qr-labels-${selectedGrid}.pdf`);
      } else {
        doc.autoPrint();
        const blobUrl = doc.output("bloburl");
        window.open(blobUrl, "_blank");
      }
      onClose();
    } catch (err) {
      console.error("PDF Generation error:", err);
      alert("Failed to generate QR sheet PDF");
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
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-black text-lg text-slate-900 leading-tight">
                {singleItem ? `Print QR Label: ${singleItem.name}` : "Print QR Label Sheet (A4)"}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Generate printable vector QR code sheets with shop logo, item names & serials.
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

        {/* Form Body */}
        <div className="mt-5 space-y-5">
          {/* Grid Preset Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Grid className="w-3.5 h-3.5 text-emerald-600" /> Choose Grid Layout (A4 Portrait)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {GRID_OPTIONS.map((g) => (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => setSelectedGrid(g.value)}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    selectedGrid === g.value
                      ? "border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20 font-bold shadow-sm"
                      : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium"
                  }`}
                >
                  <div className="font-display font-black text-sm">{g.label}</div>
                  <div className="text-[10px] text-slate-500 leading-tight mt-0.5">{g.desc.split(" ")[0]} tags</div>
                </button>
              ))}
            </div>
          </div>

          {/* Repeat Count */}
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
                className="w-28 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-xs text-slate-500">
                Total labels to generate: <strong className="text-slate-800">{targetItems.length * repeatCount}</strong>
              </span>
            </div>
          </div>

          {/* Specs note */}
          <div className="p-3 bg-cream-200 rounded-xl border border-amber-200/60 text-xs text-slate-700 space-y-1">
            <p className="font-bold text-emerald-900">Label Cell Specifications:</p>
            <p className="text-[11px] text-slate-600">
              * Rounded border frame with centered crisp vector QR code (encoding item serial).
              <br />
              * Top-right auto-scaled Sappy Stationary logo.
              <br />
              * 2-line wrapped item name + serial number footer on each label.
            </p>
          </div>
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
            disabled={loading}
            onClick={() => handleGeneratePdf("print")}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
          >
            <Printer className="w-3.5 h-3.5" />
            Direct Print
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => handleGeneratePdf("download")}
            className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 rounded-xl shadow-md shadow-emerald-700/20 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            Download PDF
          </button>
        </div>
      </div>
    </div>
  );
}
