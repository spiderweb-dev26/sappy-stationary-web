"use client";

import React, { useState, useEffect } from "react";
import { CreditCard, Plus, CheckCircle2, DollarSign, Loader2 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";

export default function CreditsClient() {
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
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
      <div>
        <h1 className="font-display font-black text-2xl sm:text-3xl text-slate-900 tracking-tight flex items-center gap-3">
          <CreditCard className="w-8 h-8 text-emerald-700" />
          Customer Credit Book & Receivables
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Manage outstanding customer balances, credit installments, and payment history.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
            <tr>
              <th className="py-3 px-4">Customer Name</th>
              <th className="py-3 px-4">Phone</th>
              <th className="py-3 px-4 text-right">Total Credit</th>
              <th className="py-3 px-4 text-right">Remaining Balance</th>
              <th className="py-3 px-4">Due Date</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {credits.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="py-3 px-4 font-bold text-slate-900">{c.customerName}</td>
                <td className="py-3 px-4 text-slate-600">{c.customerPhone || "-"}</td>
                <td className="py-3 px-4 text-right font-medium text-slate-700">{formatCurrency(c.totalAmount)}</td>
                <td className="py-3 px-4 text-right font-black text-rose-700">{formatCurrency(c.remainingAmount)}</td>
                <td className="py-3 px-4 text-slate-600">{formatDate(c.dueDate)}</td>
                <td className="py-3 px-4">
                  <span
                    className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                      c.status === "PAID"
                        ? "bg-emerald-100 text-emerald-800"
                        : c.status === "PARTIALLY_PAID"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {c.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  {c.remainingAmount > 0 && (
                    <button
                      onClick={() => {
                        setActiveCredit(c);
                        setPayAmount(c.remainingAmount);
                      }}
                      className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs"
                    >
                      Pay Installment
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pay Modal */}
      {activeCredit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="font-display font-black text-lg text-slate-900 pb-2 border-b border-slate-100">
              Record Installment: {activeCredit.customerName}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Outstanding balance: <strong>{formatCurrency(activeCredit.remainingAmount)}</strong>
            </p>

            <form onSubmit={handlePay} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Payment Amount (ETB) *</label>
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
                <label className="block font-bold text-slate-700 mb-1">Payment Note (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Telebirr ref #9832"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveCredit(null)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
