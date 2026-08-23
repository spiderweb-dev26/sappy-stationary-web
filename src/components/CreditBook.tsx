"use client";

import React, { useState, useEffect } from "react";
import { CreditCard, CheckCircle2, DollarSign, Loader2 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";

export default function CreditBook({ onPaymentComplete }: { onPaymentComplete?: () => void }) {
  const [credits, setCredits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCredit, setActiveCredit] = useState<any | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payNote, setPayNote] = useState("");

  const fetchCredits = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/credits");
      if (res.ok) setCredits(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCredits();
  }, []);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCredit || payAmount <= 0) return;

    try {
      const res = await fetch(`/api/credits/${activeCredit.id}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: payAmount, note: payNote }),
      });
      if (res.ok) {
        setActiveCredit(null);
        setPayAmount(0);
        setPayNote("");
        fetchCredits();
        onPaymentComplete?.();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-3 text-xs">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-black text-sm text-slate-900 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-emerald-700" />
          Customer Credit Accounts
        </h3>
        <span className="text-slate-500 font-bold">
          Active: {credits.filter((c) => c.status !== "PAID").length}
        </span>
      </div>

      <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto border border-slate-200 rounded-2xl bg-white p-2">
        {credits.length === 0 ? (
          <p className="p-4 text-center text-slate-400">No credit records found.</p>
        ) : (
          credits.map((c) => (
            <div key={c.id} className="py-2 px-2 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900">{c.customerName}</p>
                <p className="text-[10px] text-slate-500">
                  Total: {formatCurrency(c.totalAmount)} • Due: {formatDate(c.dueDate)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-black text-rose-700 font-mono">
                  {formatCurrency(c.remainingAmount)}
                </span>
                {c.remainingAmount > 0 && (
                  <button
                    onClick={() => {
                      setActiveCredit(c);
                      setPayAmount(c.remainingAmount);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold text-[10px]"
                  >
                    Pay
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {activeCredit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200 space-y-3">
            <h4 className="font-display font-black text-base text-slate-900">
              Installment for {activeCredit.customerName}
            </h4>
            <p className="text-xs text-slate-500">
              Remaining balance: <strong>{formatCurrency(activeCredit.remainingAmount)}</strong>
            </p>

            <form onSubmit={handlePay} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Amount (ETB)</label>
                <input
                  type="number"
                  step="0.01"
                  max={activeCredit.remainingAmount}
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Payment Note</label>
                <input
                  type="text"
                  placeholder="e.g. Telebirr reference"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveCredit(null)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-md"
                >
                  Confirm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}