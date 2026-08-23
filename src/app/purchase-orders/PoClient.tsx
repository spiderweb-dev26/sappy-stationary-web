"use client";

import React, { useState, useEffect } from "react";
import { Truck, Plus, CheckCircle2 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";

export default function PoClient() {
  const [pos, setPos] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/purchase-orders")
      .then((r) => r.json())
      .then((d) => setPos(d || []));
  }, []);

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
      <div>
        <h1 className="font-display font-black text-2xl sm:text-3xl text-slate-900 tracking-tight flex items-center gap-3">
          <Truck className="w-8 h-8 text-emerald-700" />
          Restocking Purchase Orders (PO)
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Create supplier purchase orders and automatically increment inventory on shipment arrival.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
            <tr>
              <th className="py-3 px-4">PO #</th>
              <th className="py-3 px-4">Supplier</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Total Cost</th>
              <th className="py-3 px-4">Order Date</th>
              <th className="py-3 px-4">Received Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pos.map((po) => (
              <tr key={po.id} className="hover:bg-slate-50">
                <td className="py-3 px-4 font-mono font-bold text-emerald-800">{po.poNumber}</td>
                <td className="py-3 px-4 font-bold text-slate-900">{po.supplier}</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-800">
                    {po.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-right font-bold text-slate-900">{formatCurrency(po.totalCost)}</td>
                <td className="py-3 px-4 text-slate-600">{formatDate(po.orderDate)}</td>
                <td className="py-3 px-4 text-slate-600">{formatDate(po.receivedDate) || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
