"use client";

import React, { useState, useEffect } from "react";
import {
  Boxes,
  Plus,
  FileSpreadsheet,
  FileText,
  Barcode,
  Search,
  Filter,
  Copy,
  Pencil,
  Trash2,
  AlertTriangle,
  Layers,
  Sparkles,
  QrCode,
  CheckCircle2,
} from "lucide-react";
import { InventoryItem, InventoryKpis } from "@/lib/types";
import { formatCurrency, formatDate, generateAutoSerial, normalizeItemName } from "@/lib/format";
import QrSheetModal from "@/components/QrSheetModal";
import SingleQrModal from "@/components/SingleQrModal";
import ImportModal from "@/components/ImportModal";
import ImportGuideModal from "@/components/ImportGuideModal";
import MasterModal from "@/components/MasterModal";
import ProgressBar from "@/components/ProgressBar";

export default function InventoryClient() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [kpis, setKpis] = useState<InventoryKpis>({
    itemsInView: 0,
    totalUnits: 0,
    stockValue: 0,
    unknownCostCount: 0,
  });
  const [duplicates, setDuplicates] = useState<{ normalizedName: string; items: InventoryItem[] }[]>([]);
  const [unreviewedCount, setUnreviewedCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<"ALL" | "DUPLICATES">("ALL");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isSingleQrModalOpen, setIsSingleQrModalOpen] = useState(false);
  const [qrItem, setQrItem] = useState<InventoryItem | null>(null);
  const [isQrSheetModalOpen, setIsQrSheetModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [isMasterModalOpen, setIsMasterModalOpen] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (selectedCategory !== "ALL") params.append("category", selectedCategory);
      if (lowStockOnly) params.append("lowStock", "true");

      const res = await fetch(`/api/inventory?${params.toString()}`);
      if (!res.ok) {
        if (res.status === 401) window.location.href = "/login";
        return;
      }
      const data = await res.json();
      setItems(data.items || []);
      setKpis(data.kpis || { itemsInView: 0, totalUnits: 0, stockValue: 0, unknownCostCount: 0 });
      setDuplicates(data.duplicates || []);
      setUnreviewedCount(data.unreviewedCount || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [search, selectedCategory, lowStockOnly]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleDeleteItem = async (password: string) => {
    if (!deletingItemId) return;
    try {
      const res = await fetch(`/api/inventory/${deletingItemId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ masterPassword: password }),
      });
      if (res.ok) {
        showToast("Item deleted successfully.");
        setDeletingItemId(null);
        setIsMasterModalOpen(false);
        fetchInventory();
      } else {
        const d = await res.json();
        alert(d.error || "Failed to delete item");
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleExportExcel = async () => {
    try {
      const res = await fetch("/api/inventory/export");
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sappy-inventory-${new Date().toISOString().split("T")[0]}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const categories = Array.from(new Set(items.map((i) => i.category || "General Stationery"))).filter(Boolean);

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6 animate-fade-in">
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-900 text-white px-5 py-3 rounded-2xl shadow-xl border border-emerald-700 flex items-center gap-3 animate-fade-in text-sm font-semibold">
          <CheckCircle2 className="w-5 h-5 text-mint-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-slate-900 tracking-tight flex items-center gap-3">
            <Boxes className="w-8 h-8 text-emerald-700" />
            Stock / Inventory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {items.length} item(s) in the shared catalog • Currency: ETB (Ethiopian Birr)
          </p>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsGuideModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl shadow-sm transition-all"
          >
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Import Guide</span>
          </button>

          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl shadow-sm transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Import Excel</span>
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl shadow-sm transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-slate-500" />
            <span>Excel</span>
          </button>

          <button
            type="button"
            onClick={() => setIsQrSheetModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-950 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-md transition-all"
          >
            <QrCode className="w-4 h-4 text-mint-300" />
            <span>Label Sheets</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingItem(null);
              setIsItemModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Items in View</span>
          <p className="text-2xl font-black text-slate-900 font-display">{kpis.itemsInView}</p>
        </div>
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Units</span>
          <p className="text-2xl font-black text-emerald-800 font-display">{kpis.totalUnits.toLocaleString()}</p>
        </div>
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Stock Value (ETB)</span>
          <p className="text-2xl font-black text-slate-900 font-display">{formatCurrency(kpis.stockValue)}</p>
        </div>
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Unknown Cost</span>
          <p className="text-2xl font-black text-rose-700 font-display">{kpis.unknownCostCount} items</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, serial (e.g. SL-26-XXXXX), category, location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <label className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={(e) => setLowStockOnly(e.target.checked)}
              className="rounded text-emerald-700 focus:ring-emerald-500"
            />
            <span>Low Stock</span>
          </label>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading && items.length === 0 ? (
          <div className="p-12">
            <ProgressBar label="Loading stationery catalog..." durationMs={450} />
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <Boxes className="w-12 h-12 mx-auto opacity-30 text-emerald-700" />
            <p className="text-sm font-bold text-slate-700">No stationery items found</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Try adjusting your search query, or click "Import Excel" to load your inventory sheet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-5">Item (Name & Flags)</th>
                  <th className="py-3.5 px-5">Serial</th>
                  <th className="py-3.5 px-5">Category</th>
                  <th className="py-3.5 px-5">Sell (ETB)</th>
                  <th className="py-3.5 px-5">Cost (ETB)</th>
                  <th className="py-3.5 px-5">Qty</th>
                  <th className="py-3.5 px-5">Location</th>
                  <th className="py-3.5 px-5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-5">
                      <div className="font-bold text-slate-900 text-sm">{item.name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        by {item.userName || "Staff"} {item.notes && `• ${item.notes}`}
                      </div>
                    </td>

                    <td className="py-4 px-5 font-mono text-emerald-800 font-bold">
                      {item.serial}
                    </td>

                    <td className="py-4 px-5">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {item.category}
                      </span>
                    </td>

                    <td className="py-4 px-5 font-black text-slate-900 text-sm">
                      {formatCurrency(item.sellingPrice)}
                    </td>

                    <td className="py-4 px-5 font-bold text-slate-600">
                      {item.costUnknown ? (
                        <span className="text-amber-600 font-bold text-[10px]">Unknown</span>
                      ) : (
                        formatCurrency(item.costPrice)
                      )}
                    </td>

                    <td className="py-4 px-5">
                      <span
                        className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                          item.quantity <= item.minStock
                            ? "bg-rose-100 text-rose-800 font-black"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {item.quantity} {item.unit}
                      </span>
                    </td>

                    <td className="py-4 px-5 text-slate-500 font-medium">
                      {item.location || "-"}
                    </td>

                    <td className="py-4 px-5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setQrItem(item);
                            setIsSingleQrModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 transition-colors"
                          title="View 2D QR Code"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setDeletingItemId(item.id);
                            setIsMasterModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Item (Master-gated)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* QR Sheets Modal */}
      <QrSheetModal
        isOpen={isQrSheetModalOpen}
        onClose={() => setIsQrSheetModalOpen(false)}
        items={selectionMode && selectedIds.length > 0 ? items.filter((i) => selectedIds.includes(i.id)) : items}
      />

      {/* Import Modal */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={(count, newItems) => {
          showToast(`Imported ${count} item(s) successfully!`);
          if (newItems && newItems.length > 0) {
            setItems((prev) => [...newItems, ...prev]);
            setKpis((prev) => {
              let units = prev.totalUnits;
              let val = prev.stockValue;
              let unk = prev.unknownCostCount;
              newItems.forEach((it) => {
                units += it.quantity || 0;
                val += (it.sellingPrice || 0) * (it.quantity || 0);
                if (it.costUnknown) unk++;
              });
              return {
                itemsInView: prev.itemsInView + newItems.length,
                totalUnits: units,
                stockValue: val,
                unknownCostCount: unk,
              };
            });
          }
          fetchInventory();
        }}
      />

      {/* Single QR Preview Modal */}
      {isSingleQrModalOpen && qrItem && (
        <SingleQrModal
          isOpen={isSingleQrModalOpen}
          onClose={() => {
            setIsSingleQrModalOpen(false);
            setQrItem(null);
          }}
          item={qrItem}
        />
      )}

      {/* Import Guide Modal */}
      <ImportGuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
      />

      {/* Master Modal for Delete */}
      <MasterModal
        isOpen={isMasterModalOpen}
        title="Authorize Item Deletion"
        description="Deleting catalog items permanently requires Master Passcode verification."
        onConfirm={handleDeleteItem}
        onClose={() => {
          setIsMasterModalOpen(false);
          setDeletingItemId(null);
        }}
      />
    </div>
  );
}