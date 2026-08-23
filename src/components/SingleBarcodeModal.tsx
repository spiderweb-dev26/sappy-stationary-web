"use client";

import React, { useState } from "react";
import {
  Barcode,
  Printer,
  Download,
  Copy,
  Check,
  X,
  Tag,
  Boxes,
  MapPin,
  DollarSign,
} from "lucide-react";
import { InventoryItem } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/format";
import { generateBarcodeSvg } from "@/lib/barcode";
import { generateBarcodeSheetPdf } from "@/lib/pdf";

interface SingleBarcodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null;
  onOpenBatchPrint?: (item: InventoryItem) => void;
}

export default function SingleBarcodeModal({
  isOpen,
  onClose,
  item,
}: SingleBarcodeModalProps) {
  const [copied, setCopied] = useState(false);
  const [printCopies, setPrintCopies] = useState(24);

  if (!isOpen || !item) return null;

  const serial = item.serial || item.sku || `SL-26-${item.id.slice(-5).toUpperCase()}`;
  const barcodeSvg = generateBarcodeSvg(serial, {
    width: 280,
    height: 80,
    showText: true,
    fontSize: 12,
    lineColor: "#064e3b",
    margin: 6,
  });

  const handleCopySerial = () => {
    navigator.clipboard.writeText(serial);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSvg = () => {
    const blob = new Blob([barcodeSvg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `barcode-${serial}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDirectPrintSingle = () => {
    const fullList = Array(printCopies).fill(item);
    const doc = generateBarcodeSheetPdf(fullList, { grid: "3x8" });
    doc.autoPrint();
    const blobUrl = doc.output("bloburl");
    window.open(blobUrl, "_blank");
  };

  const isLowStock = item.quantity <= item.minStock;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-7 border border-slate-200 animate-scale-up space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-200/80 shadow-sm">
              <Barcode className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display font-black text-lg text-slate-900 leading-tight">
                Item Barcode & Specifications
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Standard Code 128 barcode sticker and inventory details.
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

        {/* Barcode Visual Card */}
        <div className="p-5 bg-cream-50 rounded-2xl border-2 border-dashed border-emerald-200 flex flex-col items-center justify-center shadow-inner relative group">
          <div className="flex items-center justify-between w-full mb-3 px-1">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-900 flex items-center justify-center p-0.5">
                <img src="/img/logo.png" alt="Sappy" className="w-full h-full object-contain" />
              </div>
              <span className="font-display font-black text-xs text-emerald-950 tracking-tight">
                SAPPY STATIONARY
              </span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black font-mono">
              {formatCurrency(item.sellingPrice)}
            </span>
          </div>

          <h4 className="font-bold text-sm text-slate-900 text-center mb-3 line-clamp-2 px-2">
            {item.name}
          </h4>

          {/* SVG Barcode */}
          <div
            className="w-full max-w-[280px] bg-white p-2 rounded-xl border border-slate-200 shadow-sm flex items-center justify-center"
            dangerouslySetInnerHTML={{ __html: barcodeSvg }}
          />

          {/* Serial Bar with Copy */}
          <div className="mt-3 flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-mono font-bold text-emerald-900 shadow-sm">
            <span>{serial}</span>
            <button
              onClick={handleCopySerial}
              title="Copy Serial Code"
              className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-emerald-700 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Item Specification Details Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5">Category</span>
            <span className="font-bold text-slate-800 truncate block">{item.category}</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5">Stock Level</span>
            <span className={`font-black ${isLowStock ? "text-rose-600" : "text-emerald-700"}`}>
              {item.quantity} {item.unit} {isLowStock && "(Low)"}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5">Cost Price</span>
            <span className="font-bold text-slate-700">
              {item.costUnknown ? "Unknown" : formatCurrency(item.costPrice)}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5">Store Location</span>
            <span className="font-bold text-slate-700 truncate block">{item.location || "Shelf A-1"}</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5">Supplier</span>
            <span className="font-bold text-slate-700 truncate block">{item.supplier || "Standard"}</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5">Date Added</span>
            <span className="font-bold text-slate-700">{formatDate(item.createdAt)}</span>
          </div>
        </div>

        {/* Print Settings & Actions */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            <label className="font-bold text-slate-600">Stickers:</label>
            <select
              value={printCopies}
              onChange={(e) => setPrintCopies(parseInt(e.target.value, 10) || 24)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-xs"
            >
              <option value="1">1 Sticker</option>
              <option value="8">8 Stickers (1/3 sheet)</option>
              <option value="24">24 Stickers (1 Full A4 sheet)</option>
              <option value="48">48 Stickers (2 Full A4 sheets)</option>
              <option value="72">72 Stickers (3 Full A4 sheets)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadSvg}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              SVG Barcode
            </button>
            <button
              type="button"
              onClick={handleDirectPrintSingle}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-md shadow-emerald-700/20 transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Stickers
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}