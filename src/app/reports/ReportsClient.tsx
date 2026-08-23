"use client";

import React, { useState, useEffect } from "react";
import { BarChart3, FileSpreadsheet, FileText, TrendingUp, DollarSign, Boxes, Receipt } from "lucide-react";
import { formatCurrency } from "@/lib/format";

export default function ReportsClient() {
  const [report, setReport] = useState<any>(null);

  useEffect(() => {
    fetch("/api/reports")
      .then((r) => r.json())
      .then((d) => setReport(d));
  }, []);

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-slate-900 tracking-tight flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-emerald-700" />
            Financial & Profit/Loss Reports
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Analyze gross revenues, cost of goods sold, profit margins, and net income.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gross Sales Revenue</p>
          <p className="font-display font-black text-3xl text-emerald-800">{formatCurrency(report?.grossRevenue || 0)}</p>
          <p className="text-xs text-slate-400">Total revenue from completed POS tickets</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cost of Goods Sold (COGS)</p>
          <p className="font-display font-black text-3xl text-slate-800">{formatCurrency(report?.totalCogs || 0)}</p>
          <p className="text-xs text-slate-400">Cost valuation of sold stock</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Estimated Gross Profit</p>
          <p className="font-display font-black text-3xl text-emerald-700">{formatCurrency(report?.grossProfit || 0)}</p>
          <p className="text-xs text-slate-400">Gross margin before store expenses</p>
        </div>
      </div>
    </div>
  );
}
