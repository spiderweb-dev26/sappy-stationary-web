"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  BarChart3,
  Boxes,
  ShoppingCart,
  Receipt,
  TrendingUp,
  AlertTriangle,
  Store,
  DollarSign,
  Tag,
  CheckCircle2,
} from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/format";

export default function DashboardClient() {
  const [report, setReport] = useState<any>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [repRes, invRes, saleRes, actRes] = await Promise.all([
          fetch("/api/reports"),
          fetch("/api/inventory"),
          fetch("/api/sales"),
          fetch("/api/activities"),
        ]);
        if (repRes.ok) setReport(await repRes.json());
        if (invRes.ok) {
          const invData = await invRes.json();
          setInventory(invData.items || []);
        }
        if (saleRes.ok) {
          const sData = await saleRes.json();
          setRecentSales(sData.sales || []);
        }
        if (actRes.ok) setActivities(await actRes.json());
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const totalItemsCount = inventory.length;
  const lowStockItems = inventory.filter((i) => i.quantity <= i.minStock);
  const outOfStockItems = inventory.filter((i) => i.quantity === 0);
  const inStockUnits = inventory.reduce((acc, i) => acc + (i.quantity || 0), 0);

  const categoryCounts: { [key: string]: { count: number; units: number; val: number } } = {};
  inventory.forEach((i) => {
    const cat = i.category || "General";
    if (!categoryCounts[cat]) categoryCounts[cat] = { count: 0, units: 0, val: 0 };
    categoryCounts[cat].count++;
    categoryCounts[cat].units += i.quantity || 0;
    categoryCounts[cat].val += (i.quantity || 0) * (i.sellingPrice || 0);
  });

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800/80 border border-emerald-500/30 text-mint-200 text-xs font-bold uppercase tracking-wider">
              <Store className="w-3.5 h-3.5" /> Sappy Stationary Store Operations
            </div>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight">
              Executive Store Dashboard & Live Metrics
            </h1>
            <p className="text-emerald-200/90 text-xs sm:text-sm max-w-xl">
              Comprehensive overview of real-time sales, inventory valuations, stock alerts, and POS terminal activity.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/sales"
              className="flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-display font-bold text-xs rounded-2xl shadow-lg shadow-emerald-950/40 transition-all group"
            >
              <ShoppingCart className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span>Launch POS Ticket</span>
            </Link>
            <Link
              href="/inventory"
              className="flex items-center gap-2 px-4 py-3 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 text-mint-200 font-bold text-xs rounded-2xl transition-all"
            >
              <Boxes className="w-4 h-4" />
              <span>Stock Catalog</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Primary Financial KPIs Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Gross Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="font-display font-black text-2xl sm:text-3xl text-slate-900 mt-2">
            {formatCurrency(report?.grossRevenue || 0)}
          </p>
          <div className="text-[11px] text-emerald-700 font-semibold mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{report?.salesCount || 0} completed tickets</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Estimated Gross Profit</span>
            <div className="w-8 h-8 rounded-xl bg-mint-50 text-mint-700 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <p className="font-display font-black text-2xl sm:text-3xl text-emerald-800 mt-2">
            {formatCurrency(report?.grossProfit || 0)}
          </p>
          <div className="text-[11px] text-slate-400 mt-1">
            COGS: {formatCurrency(report?.totalCogs || 0)}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Retail Stock Value</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="font-display font-black text-2xl sm:text-3xl text-slate-900 mt-2">
            {formatCurrency(report?.inventoryValuation?.retailValue || 0)}
          </p>
          <div className="text-[11px] text-slate-500 mt-1">
            Cost basis: {formatCurrency(report?.inventoryValuation?.costValue || 0)}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Store Expenses</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <p className="font-display font-black text-2xl sm:text-3xl text-rose-700 mt-2">
            {formatCurrency(report?.totalExpenses || 0)}
          </p>
          <div className="text-[11px] text-slate-500 mt-1">
            Net Margin: <strong>{formatCurrency((report?.grossProfit || 0) - (report?.totalExpenses || 0))}</strong>
          </div>
        </div>
      </div>

      {/* Inventory Health & Stock Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Stock Breakdown */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="font-display font-black text-base text-slate-900 flex items-center gap-2">
              <Boxes className="w-5 h-5 text-emerald-700" />
              Inventory Health
            </h2>
            <Link href="/inventory" className="text-xs font-bold text-emerald-700 hover:underline">
              View All
            </Link>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="font-medium text-slate-600">Total Unique SKUs</span>
              <span className="font-black text-slate-900">{totalItemsCount} items</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50 border border-emerald-100">
              <span className="font-medium text-emerald-900">Total Units in Stock</span>
              <span className="font-black text-emerald-800">{inStockUnits.toLocaleString()} units</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-50 border border-amber-100">
              <span className="font-medium text-amber-900">Low Stock Warnings</span>
              <span className="font-black text-amber-800">{lowStockItems.length} items</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-rose-50 border border-rose-100">
              <span className="font-medium text-rose-900">Out of Stock (0 Qty)</span>
              <span className="font-black text-rose-800">{outOfStockItems.length} items</span>
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="font-display font-black text-base text-slate-900 flex items-center gap-2">
              <Tag className="w-5 h-5 text-emerald-700" />
              Category Valuation
            </h2>
            <span className="text-xs text-slate-400">{Object.keys(categoryCounts).length} Categories</span>
          </div>

          <div className="space-y-2.5 max-h-64 overflow-y-auto text-xs pr-1">
            {Object.entries(categoryCounts).map(([cat, val]) => (
              <div key={cat} className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">{cat}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{val.count} items • {val.units} units</div>
                </div>
                <div className="font-black text-emerald-800 font-mono text-right">
                  {formatCurrency(val.val)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock Alerts & Restock List */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="font-display font-black text-base text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              Stock Restock Alerts
            </h2>
            <Link href="/purchase-orders" className="text-xs font-bold text-emerald-700 hover:underline">
              Create PO
            </Link>
          </div>

          {lowStockItems.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700">All stock levels healthy</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto text-xs">
              {lowStockItems.slice(0, 5).map((item) => (
                <div key={item.id} className="p-2.5 rounded-2xl bg-rose-50/70 border border-rose-200/80 flex items-center justify-between">
                  <div className="truncate max-w-[170px]">
                    <div className="font-bold text-slate-900 truncate">{item.name}</div>
                    <div className="text-[10px] text-slate-500">{item.serial} • Loc: {item.location || "-"}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="px-2 py-0.5 rounded-full bg-rose-200 text-rose-900 font-black text-[10px]">
                      {item.quantity} {item.unit} left
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent POS Sales & Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales Tickets */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="font-display font-black text-base text-slate-900 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-emerald-700" />
              Recent POS Tickets
            </h2>
            <Link href="/sales" className="text-xs font-bold text-emerald-700 hover:underline">
              View All POS
            </Link>
          </div>

          <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
            {recentSales.slice(0, 5).map((s) => (
              <div key={s.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <div className="font-mono font-bold text-emerald-800">{s.receiptNo}</div>
                  <div className="text-slate-500 text-[11px]">{s.customerName || "Walk-in"} • {s.items.length} items</div>
                </div>
                <div className="text-right">
                  <div className="font-black text-slate-900 font-mono">{formatCurrency(s.totalAmount)}</div>
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[9px] font-bold text-slate-600">
                    {s.paymentMethod}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Audit Activity Stream */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="font-display font-black text-base text-slate-900 flex items-center gap-2">
              <Boxes className="w-5 h-5 text-emerald-700" />
              Audit Activity Stream
            </h2>
            <Link href="/activity" className="text-xs font-bold text-emerald-700 hover:underline">
              Audit Logs
            </Link>
          </div>

          <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
            {activities.slice(0, 5).map((act) => (
              <div key={act.id} className="py-2.5 flex items-start justify-between text-xs gap-3">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[9px]">
                      {act.action}
                    </span>
                    <span className="font-medium text-slate-800 line-clamp-1">{act.details}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">{act.userName || "Staff"}</p>
                </div>
                <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                  {formatDateTime(act.createdAt).split(",") || "-"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}