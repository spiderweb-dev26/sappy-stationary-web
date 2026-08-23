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
  Loader2,
  Receipt,
  History,
  Undo2,
} from "lucide-react";
import { InventoryItem, Sale } from "@/lib/types";
import { formatCurrency, formatDateTime, normalizeScannedCode } from "@/lib/format";
import { generateReceiptPdf } from "@/lib/pdf";
import QrScannerModal from "@/components/QrScannerModal";
import CreditBook from "@/components/CreditBook";
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

  // Per-line suggestions search state
  const [activeSuggestionLine, setActiveSuggestionLine] = useState<string | null>(null);
  const [suggestionQuery, setSuggestionQuery] = useState("");

  // Modals & Actions
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scanningTargetLineId, setScanningTargetLineId] = useState<string | null>(null);
  const [isMasterModalOpen, setIsMasterModalOpen] = useState(false);
  const [masterAction, setMasterAction] = useState<{ type: "refund" | "delete"; saleId: string } | null>(null);
  const [showCreditBook, setShowCreditBook] = useState(false);

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

  const todayNetRevenue = recentSales
    .filter((s) => s.status === "COMPLETED")
    .reduce((sum, s) => sum + s.totalAmount, 0);

  const handleQrScan = (rawScanned: string) => {
    const cleanSerial = normalizeScannedCode(rawScanned);
    if (!cleanSerial) return;

    const matchedItem = inventory.find(
      (it) =>
        normalizeScannedCode(it.serial) === cleanSerial ||
        (it.sku && normalizeScannedCode(it.sku) === cleanSerial)
    );

    if (matchedItem) {
      const existingLineIndex = ticketLines.findIndex(
        (l) => l.itemId === matchedItem.id || normalizeScannedCode(l.serial) === cleanSerial
      );

      if (existingLineIndex !== -1) {
        const updated = [...ticketLines];
        updated[existingLineIndex].quantity += 1;
        setTicketLines(updated);
        flashToast(`Incremented "${matchedItem.name}" quantity to ${updated[existingLineIndex].quantity}`);
      } else {
        if (scanningTargetLineId) {
          setTicketLines(
            ticketLines.map((l) =>
              l.id === scanningTargetLineId
                ? {
                    ...l,
                    itemId: matchedItem.id,
                    serial: matchedItem.serial,
                    name: matchedItem.name,
                    quantity: 1,
                    unitPrice: matchedItem.sellingPrice,
                    discount: 0,
                    availableStock: matchedItem.quantity,
                  }
                : l
            )
          );
        } else if (ticketLines.length === 1 && !ticketLines[0].name && !ticketLines[0].serial) {
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

    setScanningTargetLineId(null);
  };

  const addLine = () => {
    setTicketLines([
      ...ticketLines,
      { id: `line-${Date.now()}`, serial: "", name: "", quantity: 1, unitPrice: 0, discount: 0 },
    ]);
  };

  const removeLine = (id: string) => {
    if (ticketLines.length <= 1) return;
    setTicketLines(ticketLines.filter((l) => l.id !== id));
  };

  const handleSelectItem = (lineId: string, item: InventoryItem) => {
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
    setActiveSuggestionLine(null);
    setSuggestionQuery("");
  };

  const linesSubtotal = ticketLines.reduce((sum, l) => {
    const lineTotal = Math.max(0, (l.quantity || 1) * (l.unitPrice || 0) - (l.discount || 0));
    return sum + lineTotal;
  }, 0);

  const grandTotal = Math.max(0, linesSubtotal - ticketDiscount);

  const handleRecordSale = async () => {
    const filledLines = ticketLines.filter((l) => l.name.trim() !== "");
    if (filledLines.length === 0) {
      flashToast("Please add at least one item to the sales ticket.", "warn");
      return;
    }

    for (const l of filledLines) {
      if (!l.unitPrice || l.unitPrice <= 0) {
        flashToast(`Please enter a valid unit price for "${l.name || l.serial}".`, "warn");
        return;
      }
      if (!l.quantity || l.quantity < 1) {
        flashToast(`Quantity must be at least 1 for "${l.name}".`, "warn");
        return;
      }
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
        items: filledLines.map((l) => ({
          itemId: l.itemId,
          serial: l.serial,
          itemName: l.name,
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
        flashToast(`Sale ${data.sale.receiptNo} status: ${data.sale.status}`);
      } else if (masterAction.type === "delete") {
        const res = await fetch(`/api/sales/${masterAction.saleId}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ masterPassword: password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Delete failed");
        flashToast("Sale deleted and inventory adjusted.");
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

      {/* Header matching spec */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-slate-900 tracking-tight flex items-center gap-3">
            <ShoppingCart className="w-8 h-8 text-emerald-700" />
            Transactions / Sales
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Record by name, serial or scan. Today (net): <strong className="text-emerald-800 font-mono">{formatCurrency(todayNetRevenue)}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowCreditBook(!showCreditBook)}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
              showCreditBook
                ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                : "bg-white hover:bg-slate-50 border border-slate-200 text-slate-700"
            }`}
          >
            <CreditCard className="w-4 h-4 text-emerald-700" />
            <span>Credit Book</span>
          </button>
          <button
            onClick={() => {
              setScanningTargetLineId(null);
              setIsScannerOpen(true);
            }}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-2xl shadow-lg shadow-emerald-700/20 transition-all group"
          >
            <Camera className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span>Scan Code</span>
          </button>
        </div>
      </div>

      {/* Embedded Credit Book */}
      {showCreditBook && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <CreditBook onPaymentComplete={fetchInitialData} />
        </div>
      )}

      {/* Ticket Builder Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="font-display font-black text-base text-slate-900 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-700" />
                Active Sales Ticket
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                  {ticketLines.length} line(s)
                </span>
              </h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setScanningTargetLineId(null);
                    setIsScannerOpen(true);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                >
                  <Camera className="w-3.5 h-3.5 text-emerald-700" />
                  Scan
                </button>
                <button
                  type="button"
                  onClick={addLine}
                  className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl"
                >
                  <Plus className="w-3.5 h-3.5" />
                  + Line
                </button>
              </div>
            </div>

            {/* Ticket Lines */}
            <div className="space-y-3">
              {ticketLines.map((line, idx) => {
                const lineTotal = Math.max(0, (line.quantity || 1) * (line.unitPrice || 0) - (line.discount || 0));
                const suggestions = inventory
                  .filter(
                    (i) =>
                      suggestionQuery &&
                      (i.name.toLowerCase().includes(suggestionQuery.toLowerCase()) ||
                        i.serial.toLowerCase().includes(suggestionQuery.toLowerCase()))
                  )
                  .slice(0, 5);

                return (
                  <div
                    key={line.id}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col gap-2 text-xs relative"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 relative">
                        <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-mono font-bold shrink-0">
                          {idx + 1}
                        </span>

                        <div className="relative flex-1">
                          <input
                            type="text"
                            placeholder="Type item name or serial (e.g. SL-26-...)"
                            value={activeSuggestionLine === line.id ? suggestionQuery : line.name || line.serial}
                            onFocus={() => {
                              setActiveSuggestionLine(line.id);
                              setSuggestionQuery(line.name || "");
                            }}
                            onChange={(e) => {
                              setActiveSuggestionLine(line.id);
                              setSuggestionQuery(e.target.value);
                              setTicketLines(
                                ticketLines.map((l) => (l.id === line.id ? { ...l, name: e.target.value } : l))
                              );
                            }}
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                          />

                          {activeSuggestionLine === line.id && suggestions.length > 0 && (
                            <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-white border border-slate-200 rounded-2xl shadow-xl divide-y divide-slate-100 overflow-hidden">
                              {suggestions.map((sug) => (
                                <button
                                  key={sug.id}
                                  type="button"
                                  onClick={() => handleSelectItem(line.id, sug)}
                                  className="w-full px-3 py-2 text-left hover:bg-emerald-50 flex items-center justify-between text-xs transition-colors"
                                >
                                  <div>
                                    <div className="font-bold text-slate-900">{sug.name}</div>
                                    <div className="text-[10px] text-slate-400 font-mono">{sug.serial}</div>
                                  </div>
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px]">
                                    {formatCurrency(sug.sellingPrice)}
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setScanningTargetLineId(line.id);
                            setIsScannerOpen(true);
                          }}
                          className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-emerald-700 shrink-0"
                          title="Scan into this line"
                        >
                          <Camera className="w-4 h-4" />
                        </button>
                      </div>

                      <button
                        type="button"
                        disabled={ticketLines.length <= 1}
                        onClick={() => removeLine(line.id)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors disabled:opacity-30"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-4 gap-2 pt-1">
                      <div>
                        <label className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Qty</label>
                        <input
                          type="number"
                          min="1"
                          value={line.quantity}
                          onChange={(e) => {
                            const val = Math.max(1, parseInt(e.target.value, 10) || 1);
                            setTicketLines(ticketLines.map((l) => (l.id === line.id ? { ...l, quantity: val } : l)));
                          }}
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded-xl font-bold text-center"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Unit (ETB)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={line.unitPrice}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setTicketLines(ticketLines.map((l) => (l.id === line.id ? { ...l, unitPrice: val } : l)));
                          }}
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded-xl font-bold text-right"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Discount</label>
                        <input
                          type="number"
                          step="0.01"
                          value={line.discount}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setTicketLines(ticketLines.map((l) => (l.id === line.id ? { ...l, discount: val } : l)));
                          }}
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded-xl font-bold text-right text-rose-700"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Line Total</label>
                        <div className="px-2 py-1 bg-emerald-50 text-emerald-900 font-black rounded-xl text-right font-mono">
                          {lineTotal.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {line.serial && (
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                        <span className="px-2 py-0.5 rounded bg-slate-200/80 text-slate-700 font-bold">
                          {line.serial}
                        </span>
                        {line.availableStock !== undefined && (
                          <span>Stock in store: <strong>{line.availableStock}</strong></span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Customer / Organization</label>
                <input
                  type="text"
                  placeholder="Walk-in Customer"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Customer Phone</label>
                <input
                  type="text"
                  placeholder="+251 9..."
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={isBackdated}
                  onChange={(e) => setIsBackdated(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded"
                />
                <span>Backdated Ticket</span>
              </label>

              {isBackdated && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-700" />
                  <input
                    type="date"
                    value={backdateVal}
                    onChange={(e) => setBackdateVal(e.target.value)}
                    className="px-2.5 py-1 bg-white border border-slate-200 rounded-xl font-bold text-xs"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-5">
            <h2 className="font-display font-black text-base text-slate-900">Payment & Summary</h2>

            <div className="grid grid-cols-2 gap-2 text-xs">
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
                        ? "bg-emerald-800 text-white border-emerald-800 shadow-md font-bold"
                        : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700 font-medium"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="p-4 bg-cream-50 rounded-2xl border border-emerald-200/80 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
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

              <div className="pt-2 border-t border-emerald-200 flex justify-between items-baseline">
                <span className="font-display font-black text-base text-slate-900">Grand Total:</span>
                <span className="font-display font-black text-2xl text-emerald-800 font-mono">
                  {formatCurrency(grandTotal)}
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={recording || linesSubtotal <= 0}
              onClick={handleRecordSale}
              className="w-full py-3.5 px-4 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-display font-black text-base rounded-2xl shadow-xl shadow-emerald-700/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {recording ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
              <span>Record Sale Ticket</span>
            </button>
          </div>
        </div>
      </div>

      {/* Today's Sales Table & History */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="font-display font-black text-base text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-700" />
            Today's Sales & Transactions
          </h2>
          <span className="text-xs font-bold text-slate-500">
            Total Tickets: {recentSales.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Time / Date</th>
                <th className="py-3 px-4">Sale No</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Items Summary</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4 text-right">Total (ETB)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentSales.map((sale) => {
                const isRefunded = sale.status === "REFUNDED";
                return (
                  <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 text-slate-500 font-mono">
                      {formatDateTime(sale.createdAt)}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-800">
                      {sale.receiptNo}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {sale.customerName || "Walk-in"}
                      {sale.isBackdated && (
                        <span className="ml-1.5 px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-extrabold text-[9px]">
                          backdated
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className={isRefunded ? "line-through text-slate-400" : "text-slate-800 font-medium"}>
                        {sale.items.map((i) => `${i.item?.name || i.itemName || "Item"} x${i.quantity}`).join(", ")}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">by {sale.userName || sale.createdBy || "Staff"}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 font-semibold text-[10px]">
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-black text-slate-900 font-mono">
                      {formatCurrency(sale.totalAmount)}
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
                          className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setMasterAction({ type: "refund", saleId: sale.id });
                            setIsMasterModalOpen(true);
                          }}
                          title={isRefunded ? "Reverse Refund (Undo)" : "Refund / Void"}
                          className={`p-1.5 rounded-lg transition-colors ${
                            isRefunded ? "text-amber-700 hover:bg-amber-50" : "text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          <Undo2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setMasterAction({ type: "delete", saleId: sale.id });
                            setIsMasterModalOpen(true);
                          }}
                          title="Delete Sale (Master-gated)"
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50"
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

      {/* QR / Barcode Scanner Modal */}
      <QrScannerModal
        isOpen={isScannerOpen}
        onClose={() => {
          setIsScannerOpen(false);
          setScanningTargetLineId(null);
        }}
        onScan={handleQrScan}
      />

      {/* Master Gate Modal */}
      <MasterModal
        isOpen={isMasterModalOpen}
        title={masterAction?.type === "refund" ? "Authorize Sale Refund / Void" : "Authorize Sale Deletion"}
        description={
          masterAction?.type === "refund"
            ? "Toggling refund status updates inventory stock automatically."
            : "Deleting a sale ticket rolls back inventory stock and removes linked credit records."
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