"use client";

import React, { useState, useEffect } from "react";
import {
  Boxes,
  Plus,
  Search,
  Copy,
  Edit2,
  Trash2,
  Barcode,
  FileSpreadsheet,
  FileText,
  UploadCloud,
  CheckCircle2,
  Loader2,
  Layers,
  DollarSign,
  PackageCheck,
  HelpCircle,
  Eye,
} from "lucide-react";
import { InventoryItem, InventoryKpis } from "@/lib/types";
import { formatCurrency, formatDate, generateAutoSerial, normalizeItemName } from "@/lib/format";
import BarcodeSheetModal from "@/components/BarcodeSheetModal";
import SingleBarcodeModal from "@/components/SingleBarcodeModal";
import ImportModal from "@/components/ImportModal";
import MasterModal from "@/components/MasterModal";

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

  // Search & Filter
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "duplicates">("all");

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isBarcodeSheetModalOpen, setIsBarcodeSheetModalOpen] = useState(false);
  const [isSingleBarcodeModalOpen, setIsSingleBarcodeModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isMasterModalOpen, setIsMasterModalOpen] = useState(false);

  // Active target items
  const [activeItem, setActiveItem] = useState<InventoryItem | null>(null);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

  // Add Item form state
  const [formData, setFormData] = useState({
    name: "",
    category: "Writing Instruments",
    quantity: 10,
    unit: "pcs",
    costPrice: 0,
    sellingPrice: 0,
    costUnknown: false,
    location: "Shelf A",
    supplier: "",
    notes: "",
  });
  const [formError, setFormError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
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
    } catch (err) {
      console.error("Fetch inventory failed:", err);
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

  const categories = ["ALL", "Writing Instruments", "Paper & Notebooks", "Desk & Office Tools", "School & Geometry", "Art & Drafting"];

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formData.name.trim()) {
      setFormError("Item name is required.");
      return;
    }

    const normalized = normalizeItemName(formData.name);
    const existing = items.find((i) => normalizeItemName(i.name) === normalized);
    if (existing) {
      setFormError(`Item with this name is already recorded (Serial: ${existing.serial}). Please edit the existing item.`);
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, allowDuplicate: false }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create item");

      showToast(`Created "${data.name}" (${data.serial})`);
      setIsAddModalOpen(false);
      setFormData({
        name: "",
        category: "Writing Instruments",
        quantity: 10,
        unit: "pcs",
        costPrice: 0,
        sellingPrice: 0,
        costUnknown: false,
        location: "Shelf A",
        supplier: "",
        notes: "",
      });
      fetchInventory();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    setActionLoading(true);
    setFormError("");

    try {
      const res = await fetch(`/api/inventory/${editingItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingItem),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update item");

      showToast(`Updated "${data.name}"`);
      setIsEditModalOpen(false);
      setEditingItem(null);
      fetchInventory();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleMultiplyCopy = async (item: InventoryItem) => {
    try {
      const twinPayload = {
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        unit: item.unit,
        costPrice: item.costPrice,
        sellingPrice: item.sellingPrice,
        costUnknown: true,
        serial: generateAutoSerial("26"),
        location: item.location,
        supplier: item.supplier,
        notes: item.notes ? `Twin copy of ${item.serial}. ${item.notes}` : `Twin copy of ${item.serial}`,
        allowDuplicate: true,
      };

      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(twinPayload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to copy twin");

      showToast(`Twin copy created: ${data.serial}. Review in Duplicates tab.`);
      fetchInventory();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleKeepDuplicate = async (id: string) => {
    try {
      const res = await fetch(`/api/inventory/${id}/keep`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to mark kept");
      showToast(`Marked duplicate item as kept.`);
      fetchInventory();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteItem = async (password: string) => {
    if (!deletingItemId) return;
    try {
      const res = await fetch(`/api/inventory/${deletingItemId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ masterPassword: password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete item");
      showToast("Item deleted from inventory.");
      setDeletingItemId(null);
      fetchInventory();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleExport = (format: "excel" | "pdf") => {
    window.open(`/api/inventory/export?format=${format}`, "_blank");
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-900 text-white px-5 py-3 rounded-2xl shadow-xl border border-emerald-700 flex items-center gap-3 animate-fade-in text-sm font-semibold">
          <CheckCircle2 className="w-5 h-5 text-mint-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-slate-900 tracking-tight flex items-center gap-3">
            <Boxes className="w-8 h-8 text-emerald-700" />
            Stationery Inventory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time stock catalog, Code 128 barcodes, sticker sheets, and duplicate tracking.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => handleExport("excel")}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl shadow-sm transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            Export Excel
          </button>
          <button
            onClick={() => handleExport("pdf")}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl shadow-sm transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-700" />
            PDF Ledger
          </button>
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl shadow-sm transition-colors"
          >
            <UploadCloud className="w-3.5 h-3.5 text-emerald-600" />
            Import Excel
          </button>
          <button
            onClick={() => {
              setActiveItem(null);
              setIsBarcodeSheetModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-sm transition-colors"
          >
            <Barcode className="w-4 h-4 text-mint-300" />
            Batch Barcodes
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-700/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        </div>
      </div>

      {/* KPI Cards Header */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Items in View</p>
            <p className="font-display font-black text-2xl text-slate-900 mt-1">{kpis.itemsInView}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <Boxes className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Units</p>
            <p className="font-display font-black text-2xl text-emerald-800 mt-1">{kpis.totalUnits.toLocaleString()}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-mint-50 text-mint-700 flex items-center justify-center font-bold">
            <PackageCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Retail Stock Value</p>
            <p className="font-display font-black text-xl sm:text-2xl text-slate-900 mt-1">{formatCurrency(kpis.stockValue)}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Unknown Cost</p>
            <p className="font-display font-black text-2xl text-rose-700 mt-1">{kpis.unknownCostCount} items</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold">
            <HelpCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tabs & Search Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === "all"
                  ? "bg-emerald-800 text-white shadow-sm"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-600"
              }`}
            >
              All Items ({items.length})
            </button>
            <button
              onClick={() => setActiveTab("duplicates")}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                activeTab === "duplicates"
                  ? "bg-emerald-800 text-white shadow-sm"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-600"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Duplicates</span>
              {unreviewedCount > 0 && (
                <span className="px-2 py-0.5 text-[10px] rounded-full bg-rose-500 text-white font-extrabold">
                  {unreviewedCount}
                </span>
              )}
            </button>
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 select-none">
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={(e) => setLowStockOnly(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
            />
            <span>Low Stock Alerts Only</span>
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, barcode serial (e.g. SL-26-P0101), category, shelf location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>

          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === "ALL" ? "All Categories" : c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Table View */}
      {activeTab === "all" ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 flex flex-col items-center justify-center text-slate-400 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              <p className="text-xs font-medium">Loading stationery inventory...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Boxes className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-bold text-slate-700">No stationery items found</p>
              <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or click "Add Item".</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Barcode Serial</th>
                    <th className="py-3 px-4">Item Name</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-right">Stock Qty</th>
                    <th className="py-3 px-4 text-right">Cost Price</th>
                    <th className="py-3 px-4 text-right">Selling Price</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item) => {
                    const isLow = item.quantity <= item.minStock;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-emerald-800">
                          <button
                            onClick={() => {
                              setActiveItem(item);
                              setIsSingleBarcodeModalOpen(true);
                            }}
                            className="text-emerald-700 hover:text-emerald-950 flex items-center gap-1 hover:underline text-left"
                            title="Click to view full barcode & details"
                          >
                            <Barcode className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>{item.serial}</span>
                          </button>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{item.name}</div>
                          {item.notes && <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-xs">{item.notes}</div>}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[10px]">
                            {item.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[11px] ${
                              isLow ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {item.quantity} {item.unit}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-slate-600">
                          {item.costUnknown ? (
                            <span className="text-amber-600 font-bold">Unknown</span>
                          ) : (
                            formatCurrency(item.costPrice)
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900">
                          {formatCurrency(item.sellingPrice)}
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-medium">{item.location || "-"}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Barcode details icon */}
                            <button
                              onClick={() => {
                                setActiveItem(item);
                                setIsSingleBarcodeModalOpen(true);
                              }}
                              title="View Item Barcode & Details"
                              className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {/* Multiply Twin Copy */}
                            <button
                              onClick={() => handleMultiplyCopy(item)}
                              title="Multiply Twin Copy"
                              className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            {/* Edit */}
                            <button
                              onClick={() => {
                                setEditingItem(item);
                                setIsEditModalOpen(true);
                              }}
                              title="Edit Item"
                              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            {/* Delete */}
                            <button
                              onClick={() => {
                                setDeletingItemId(item.id);
                                setIsMasterModalOpen(true);
                              }}
                              title="Delete Item (Master Protected)"
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Duplicates Review Tab */
        <div className="space-y-4">
          {duplicates.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-800">No duplicate clusters detected</p>
              <p className="text-xs text-slate-400 mt-1">All item names in your catalog are unique.</p>
            </div>
          ) : (
            duplicates.map((group, gIdx) => (
              <div key={gIdx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <h3 className="font-display font-black text-sm text-slate-900">
                      Cluster: "{group.normalizedName}"
                    </h3>
                    <span className="px-2 py-0.5 text-[10px] rounded-full bg-amber-100 text-amber-800 font-bold">
                      {group.items.length} records
                    </span>
                  </div>
                </div>

                <div className="divide-y divide-slate-100">
                  {group.items.map((it) => (
                    <div key={it.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setActiveItem(it);
                              setIsSingleBarcodeModalOpen(true);
                            }}
                            className="font-mono font-bold text-emerald-800 hover:underline flex items-center gap-1"
                          >
                            <Barcode className="w-3.5 h-3.5" />
                            <span>{it.serial}</span>
                          </button>
                          <span className="font-bold text-slate-900">{it.name}</span>
                          {it.dupKeptAt && (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                              Kept by {it.dupKeptBy}
                            </span>
                          )}
                        </div>
                        <div className="text-slate-500 text-[11px] mt-0.5">
                          Qty: <strong>{it.quantity}</strong> | Cost: {formatCurrency(it.costPrice)} | Price: {formatCurrency(it.sellingPrice)} | Created: {formatDate(it.createdAt)}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {!it.dupKeptAt && (
                          <button
                            onClick={() => handleKeepDuplicate(it.id)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold text-xs transition-colors"
                          >
                            Keep
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setEditingItem(it);
                            setIsEditModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setDeletingItemId(it.id);
                            setIsMasterModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold text-xs transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Add Item Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h3 className="font-display font-black text-lg text-slate-900 pb-3 border-b border-slate-100">
              Add New Stationery Item
            </h3>

            {formError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateItem} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Item Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Pilot G2 0.7mm Retractable Gel Pen - Red"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  >
                    {categories.filter((c) => c !== "ALL").map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Stock Qty</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Cost Price (ETB)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Selling Price (ETB) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Unit</label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Shelf A-1"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-md"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {isEditModalOpen && editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h3 className="font-display font-black text-lg text-slate-900 pb-3 border-b border-slate-100">
              Edit Item: {editingItem.serial}
            </h3>

            {formError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
                {formError}
              </div>
            )}

            <form onSubmit={handleUpdateItem} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Item Name</label>
                <input
                  type="text"
                  required
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Category</label>
                  <select
                    value={editingItem.category}
                    onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  >
                    {categories.filter((c) => c !== "ALL").map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    min="0"
                    value={editingItem.quantity}
                    onChange={(e) => setEditingItem({ ...editingItem, quantity: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Cost Price (ETB)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingItem.costPrice}
                    onChange={(e) => setEditingItem({ ...editingItem, costPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Selling Price (ETB)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editingItem.sellingPrice}
                    onChange={(e) => setEditingItem({ ...editingItem, sellingPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-md"
                >
                  Update Item (PATCH)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Individual Item Barcode Modal */}
      <SingleBarcodeModal
        isOpen={isSingleBarcodeModalOpen}
        onClose={() => {
          setIsSingleBarcodeModalOpen(false);
          setActiveItem(null);
        }}
        item={activeItem}
      />

      {/* Batch Barcode Sheet Modal */}
      <BarcodeSheetModal
        isOpen={isBarcodeSheetModalOpen}
        onClose={() => setIsBarcodeSheetModalOpen(false)}
        items={items}
      />

      {/* Import Modal */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={(count) => {
          showToast(`Imported ${count} item(s) successfully!`);
          fetchInventory();
        }}
      />

      {/* Master Gate Modal */}
      <MasterModal
        isOpen={isMasterModalOpen}
        title="Delete Inventory Item"
        description="Deleting items permanently adjusts catalog records and requires master authorization."
        onConfirm={handleDeleteItem}
        onClose={() => {
          setIsMasterModalOpen(false);
          setDeletingItemId(null);
        }}
      />
    </div>
  );
}