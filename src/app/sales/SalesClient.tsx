"use client";

import React, { useState, useEffect } from "react";
import {
  ShoppingCart,
  Camera,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Printer,
  Calendar,
  CreditCard,
  Banknote,
  Smartphone,
  ShieldAlert,
  Loader2,
  RefreshCw,
  Search,
  Receipt,
  User,
  History,
} from "lucide-react";
import { InventoryItem, Sale, SaleItem } from "@/lib/types";
import { formatCurrency, formatDateTime, normalizeScannedCode } from "@/lib/format";
import { generateReceiptPdf } from "@/lib/pdf";
import QrScannerModal from "@/components/QrScannerModal";
import MasterModal from "@/components/MasterModal";

interface TicketLine {
  id: string;
  itemId?: string;
  serial: string;
  name: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  availableStock?: number;
}

export default function SalesClient() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  // Ticket Form State
  const [ticketLines, setTicketLines] = useState<TicketLine[]>([
    { id: "line-1", serial: "", name: "", quantity: 1, unitPrice: 0, discount: 0 },
  ]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [ticketDiscount, setTicketDiscount] = useState(0);
  const [ticketNotes, setTicketNotes] = useState("");
  const [isBackdated, setIsBackdated] = useState(false);
  const [backdateVal, setBackdateVal] = useState(new Date().toISOString().split("T")[0]);

  // Modals & Actions
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isMasterModalOpen, setIsMasterModalOpen] = useState(false);
  const [masterAction, setMasterAction] = useState<{ type: "refund" | "delete"; saleId: string } | null>(null);
  const [activeReceiptSale, setActiveReceiptSale] = useState<Sale | null>(null);

  // Notifications
  const [toast, setToast] = useState<{ msg: string; type: "success" | "warn" } | null>(null);
  const [recording, setRecording] = useState(false);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [invRes, salesRes] = await Promise.all([
        fetch("/api/inventory"),
        fetch("/api/sales"),
      ]);

      if (invRes.ok) {
        const invData = await invRes.json();
        setInventory(invData.items || []);
      }
      if (salesRes.ok) {
        const sData = await salesRes.json();
        setRecentSales(sData.sales || []);
      }
    } catch (err) {
      console.error("Fetch sales data failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const flashToast = (msg: string, type: "success" | "warn" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4500);
  };

  // QR Camera Scan Matcher
  const handleQrScan = (rawScanned: string) => {
    // 1. Normalize scanned code = uppercase + strip non [A-Z0-9-]
    const cleanSerial = normalizeScannedCode(rawScanned);
    if (!cleanSerial) return;

    // 2. Match item by normalized serial (or sku)
    const matchedItem = inventory.find(
      (it) =>
        normalizeScannedCode(it.serial) === cleanSerial ||
        (it.sku && normalizeScannedCode(it.sku) === cleanSerial)
    );

    if (matchedItem) {
      // If same serial already on a line, bump qty (+1)
      const existingLineIndex = ticketLines.findIndex(
        (l) => l.itemId === matchedItem.id || normalizeScannedCode(l.serial) === cleanSerial
      );

      if (existingLineIndex !== -1) {
        const updated = [...ticketLines];
        updated[existingLineIndex].quantity += 1;
        setTicketLines(updated);
        flashToast(`Incremented "${matchedItem.name}" quantity to ${updated[existingLineIndex].quantity}`);
      } else {
        // Add new line with filled name + price
        // If first line is empty, replace it
        if (ticketLines.length === 1 && !ticketLines[0].name && !ticketLines[0].serial) {
          setTicketLines([
            {
              id: `line-${Date.now()}`,
              itemId: matchedItem.id,
              serial: matchedItem.serial,
              name: matchedItem.name,
              quantity: 1,
              unitPrice: matchedItem.sellingPrice,
              discount: 0,
              availableStock: matchedItem.quantity,
            },
          ]);
        } else {
          setTicketLines([
            ...ticketLines,
            {
              id: `line-${Date.now()}`,
              itemId: matchedItem.id,
              serial: matchedItem.serial,
              name: matchedItem.name,
              quantity: 1,
              unitPrice: matchedItem.sellingPrice,
              discount: 0,
              availableStock: matchedItem.quantity,
            },
          ]);
        }
        flashToast(`Scanned: "${matchedItem.name}" (${matchedItem.serial})`);
      }
    } else {
      // If NOT in stock: add line with serial as name and flash "not found - enter unit price manually"
      const newLine: TicketLine = {
        id: `line-${Date.now()}`,
        serial: cleanSerial,
        name: cleanSerial,
        quantity: 1,
        unitPrice: 0,
        discount: 0,
      };

      if (ticketLines.length === 1 && !ticketLines[0].name && !ticketLines[0].serial) {
        setTicketLines([newLine]);
      } else {
        setTicketLines([...ticketLines, newLine]);
      }

      flashToast(`Serial "${cleanSerial}" not found - enter unit price manually`, "warn");
    }
  };

  // Line Item modifications
  const addLine = () => {
    setTicketLines([
      ...ticketLines,
      { id: `line-${Date.now()}`, serial: "", name: "", quantity: 1, unitPrice: 0, discount: 0 },
    ]);
  };

  const removeLine = (id: string) => {
    if (ticketLines.length === 1) {
      setTicketLines([{ id: "line-1", serial: "", name: "", quantity: 1, unitPrice: 0, discount: 0 }]);
      return;
    }
    setTicketLines(ticketLines.filter((l) => l.id !== id));
  };

  const handleSelectItem = (lineId: string, itemId: string) => {
    const item = inventory.find((i) => i.id === itemId);
    if (!item) return;

    setTicketLines(
      ticketLines.map((l) =>
        l.id === lineId
          ? {
              ...l,
              itemId: item.id,
              serial: item.serial,
              name: item.name,
              unitPrice: item.sellingPrice,
              availableStock: item.quantity,
            }
          : l
      )
    );
  };

  // Calculations
  const linesSubtotal = ticketLines.reduce((sum, l) => {
    const lineTotal = Math.max(0, (l.quantity || 1) * (l.unitPrice || 0) - (l.discount || 0));
    return sum + lineTotal;
  }, 0);

  const grandTotal = Math.max(0, linesSubtotal - ticketDiscount);

  // Record Sale Ticket
  const handleRecordSale = async () => {
    const validLines = ticketLines.filter((l) => l.name.trim() !== "" || (l.unitPrice && l.unitPrice > 0));
    if (validLines.length === 0) {
      flashToast("Please add at least one item to the sale ticket.", "warn");
      return;
    }

    setRecording(true);
    try {
      const payload = {
        customerName: customerName || "Walk-in Customer",
        customerPhone: customerPhone || null,
        paymentMethod,
        discount: ticketDiscount,
        notes: ticketNotes,
        isCredit: paymentMethod === "CREDIT",
        isBackdated,
        createdAt: isBackdated ? new Date(backdateVal).toISOString() : new Date().toISOString(),
        items: validLines.map((l) => ({
          itemId: l.itemId,
          serial: l.serial,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          discount: l.discount,
        })),
      };

      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to record sale");

      flashToast(`Sale recorded successfully! Receipt #${data.receiptNo}`);
      setActiveReceiptSale(data);

      // Reset ticket
      setTicketLines([{ id: "line-1", serial: "", name: "", quantity: 1, unitPrice: 0, discount: 0 }]);
      setCustomerName("");
      setCustomerPhone("");
      setTicketDiscount(0);
      setTicketNotes("");
      setIsBackdated(false);

      fetchInitialData();
    } catch (err: any) {
      flashToast(err.message, "warn");
    } finally {
      setRecording(false);
    }
  };

  // Master Protected Void / Delete Actions
  const handleMasterConfirm = async (password: string) => {
    if (!masterAction) return;

    try {
      if (masterAction.type === "refund") {
        const res = await fetch(`/api/sales/${masterAction.saleId}/refund`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ masterPassword: password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Refund failed");
        flashToast(`Sale ${data.sale.receiptNo} status toggled: ${data.sale.status}`);
      } else if (masterAction.type === "delete") {
        const res = await fetch(`/api/sales/${masterAction.saleId}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ masterPassword: password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Delete failed");
        flashToast("Sale ticket deleted and stock restored.");
      }
      fetchInitialData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setMasterAction(null);
      setIsMasterModalOpen(false);
    }
  };

  const handlePrintReceipt = (sale: Sale) => {
    const doc = generateReceiptPdf(sale, "SAPPY STATIONARY");
    doc.autoPrint();
    const blobUrl = doc.output("bloburl");
    window.open(blobUrl, "_blank");
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Flash Toast */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-2xl shadow-xl border flex items-center gap-3 animate-fade-in text-sm font-semibold ${
            toast.type === "warn"
              ? "bg-amber-900 text-amber-50 border-amber-700"
              : "bg-emerald-900 text-white border-emerald-700"
          }`}
        >
          {toast.type === "warn" ? (
            <AlertCircle className="w-5 h-5 text-amber-300" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-mint-300" />
          )}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-slate-900 tracking-tight flex items-center gap-3">
            <ShoppingCart className="w-8 h-8 text-emerald-700" />
            Point of Sale (POS)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Fast QR scan-to-cart, multi-item tickets, and atomic inventory management.
          </p>
        </div>

        <button
          onClick={() => setIsScannerOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-bold text-sm rounded-2xl shadow-lg shadow-emerald-700/20 transition-all group"
        >
          <Camera className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span>Launch QR Scanner</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: POS Ticket Builder */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="font-display font-black text-lg text-slate-900 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-700" />
                Active Sales Ticket
              </h2>
              <button
                type="button"
                onClick={addLine}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Item Line
              </button>
            </div>

            {/* Ticket Line Items */}
            <div className="space-y-3">
              {ticketLines.map((line, idx) => {
                const lineTotal = Math.max(0, (line.quantity || 1) * (line.unitPrice || 0) - (line.discount || 0));
                return (
                  <div
                    key={line.id}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center gap-3 text-xs"
                  >
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold font-mono shrink-0">
                      {idx + 1}
                    </div>

                    {/* Item selector or manual serial */}
                    <div className="flex-1 space-y-1">
                      <select
                        value={line.itemId || ""}
                        onChange={(e) => handleSelectItem(line.id, e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="">-- Choose Stationery Item or Scan QR --</option>
                        {inventory.map((it) => (
                          <option key={it.id} value={it.id}>
                            {it.name} ({it.serial}) - {formatCurrency(it.sellingPrice)} [Stock: {it.quantity}]
                          </option>
                        ))}
                      </select>

                      {line.serial && !line.itemId && (
                        <div className="text-[11px] font-mono text-amber-700 font-bold">
                          Scanned Code: {line.serial} (Manual Entry)
                        </div>
                      )}
                    </div>

                    {/* Qty & Unit Price & Discount */}
                    <div className="flex items-center gap-2">
                      <div className="w-20">
                        <label className="text-[10px] text-slate-500 uppercase font-bold block mb-0.5">Qty</label>
                        <input
                          type="number"
                          min="1"
                          value={line.quantity}
                          onChange={(e) => {
                            const val = Math.max(1, parseInt(e.target.value, 10) || 1);
                            setTicketLines(ticketLines.map((l) => (l.id === line.id ? { ...l, quantity: val } : l)));
                          }}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl font-bold text-center"
                        />
                      </div>

                      <div className="w-28">
                        <label className="text-[10px] text-slate-500 uppercase font-bold block mb-0.5">Unit Price</label>
                        <input
                          type="number"
                          step="0.01"
                          value={line.unitPrice}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setTicketLines(ticketLines.map((l) => (l.id === line.id ? { ...l, unitPrice: val } : l)));
                          }}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl font-bold text-right"
                        />
                      </div>

                      <div className="w-24">
                        <label className="text-[10px] text-slate-500 uppercase font-bold block mb-0.5">Total</label>
                        <div className="px-2.5 py-1.5 bg-emerald-50 text-emerald-800 font-black rounded-xl text-right font-mono">
                          {lineTotal.toFixed(2)}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeLine(line.id)}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors mt-3"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Backdate flag & customer metadata */}
            <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Customer Name / Organization</label>
                <input
                  type="text"
                  placeholder="Walk-in Customer"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Customer Phone (Optional)</label>
                <input
                  type="text"
                  placeholder="+251 9..."
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>
            </div>

            {/* Backdating Toggle */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={isBackdated}
                  onChange={(e) => setIsBackdated(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded"
                />
                <span>Backdate This Ticket</span>
              </label>

              {isBackdated && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-700" />
                  <input
                    type="date"
                    value={backdateVal}
                    onChange={(e) => setBackdateVal(e.target.value)}
                    className="px-3 py-1 bg-white border border-slate-200 rounded-xl font-bold text-xs"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Col: Ticket Checkout & Summary */}
        <div className="space-y-5">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-5">
            <h2 className="font-display font-black text-lg text-slate-900">Payment & Summary</h2>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Payment Method
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Cash", val: "CASH", icon: Banknote },
                  { label: "Telebirr / Mobile", val: "MOBILE", icon: Smartphone },
                  { label: "Credit Card", val: "CARD", icon: CreditCard },
                  { label: "Credit Book", val: "CREDIT", icon: FileText },
                ].map((m) => {
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.val}
                      type="button"
                      onClick={() => setPaymentMethod(m.val)}
                      className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all ${
                        paymentMethod === m.val
                          ? "bg-emerald-800 text-white border-emerald-800 shadow-md shadow-emerald-950/20 font-bold"
                          : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-medium"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-xs">{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Totals Breakdown */}
            <div className="p-4 bg-cream-200 rounded-2xl border border-amber-200/60 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal ({ticketLines.length} lines):</span>
                <span className="font-bold">{formatCurrency(linesSubtotal)}</span>
              </div>

              <div className="flex items-center justify-between text-slate-600">
                <span>Ticket Discount (ETB):</span>
                <input
                  type="number"
                  min="0"
                  value={ticketDiscount}
                  onChange={(e) => setTicketDiscount(parseFloat(e.target.value) || 0)}
                  className="w-24 px-2 py-1 bg-white border border-slate-200 rounded-xl text-right font-bold text-xs"
                />
              </div>

              <div className="pt-2 border-t border-amber-300/60 flex justify-between items-baseline">
                <span className="font-display font-black text-base text-slate-900">Grand Total:</span>
                <span className="font-display font-black text-2xl text-emerald-800 font-mono">
                  {formatCurrency(grandTotal)}
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="button"
              disabled={recording || linesSubtotal <= 0}
              onClick={handleRecordSale}
              className="w-full py-3.5 px-4 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-display font-black text-base rounded-2xl shadow-xl shadow-emerald-700/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {recording ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Record Sale & Deduct Stock</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Recent Sales Ledger & Void / Refund Master Controls */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="font-display font-black text-lg text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-700" />
            Recent Sales & POS Tickets
          </h2>
          <span className="text-xs font-bold text-slate-500">
            Total Tickets: {recentSales.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Receipt #</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Items Count</th>
                <th className="py-3 px-4 text-right">Total Amount</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentSales.map((sale) => {
                const isRefunded = sale.status === "REFUNDED";
                return (
                  <tr key={sale.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-emerald-800">
                      {sale.receiptNo}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{formatDateTime(sale.createdAt)}</td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {sale.customerName || "Walk-in"}
                    </td>
                    <td className="py-3 px-4">{sale.items.length} items</td>
                    <td className="py-3 px-4 text-right font-black text-slate-900">
                      {formatCurrency(sale.totalAmount)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 font-semibold text-[10px]">
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          isRefunded ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {sale.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handlePrintReceipt(sale)}
                          title="Print Receipt"
                          className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 transition-colors"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        {/* Refund / Void Toggle (Master-gated) */}
                        <button
                          onClick={() => {
                            setMasterAction({ type: "refund", saleId: sale.id });
                            setIsMasterModalOpen(true);
                          }}
                          title={isRefunded ? "Reverse Refund (Master Gate)" : "Void / Refund (Master Gate)"}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                            isRefunded
                              ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          }`}
                        >
                          {isRefunded ? "Un-Void" : "Void / Refund"}
                        </button>
                        {/* Delete Sale (Master-gated) */}
                        <button
                          onClick={() => {
                            setMasterAction({ type: "delete", saleId: sale.id });
                            setIsMasterModalOpen(true);
                          }}
                          title="Delete Sale Record (Master Gate)"
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
      </div>

      {/* QR Scanner Modal */}
      <QrScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleQrScan}
      />

      {/* Master Gate Modal for Void / Delete */}
      <MasterModal
        isOpen={isMasterModalOpen}
        title={masterAction?.type === "refund" ? "Authorize Sale Void / Refund" : "Authorize Sale Deletion"}
        description={
          masterAction?.type === "refund"
            ? "Toggling sale refund status automatically reverses inventory quantities."
            : "Deleting a sale ticket rolls back inventory stock and removes linked credit accounts."
        }
        onConfirm={handleMasterConfirm}
        onClose={() => {
          setIsMasterModalOpen(false);
          setMasterAction(null);
        }}
      />
    </div>
  );
}
