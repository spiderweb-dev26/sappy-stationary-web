"use client";

import React, { useState, useEffect } from "react";
import { History, ShieldCheck, User } from "lucide-react";
import { formatDateTime } from "@/lib/format";

export default function ActivityClient() {
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/activities")
      .then((r) => r.json())
      .then((d) => setActivities(d || []));
  }, []);

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
      <div>
        <h1 className="font-display font-black text-2xl sm:text-3xl text-slate-900 tracking-tight flex items-center gap-3">
          <History className="w-8 h-8 text-emerald-700" />
          Store Audit & Activity Log
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Immutable chronological log of inventory edits, sales tickets, duplicate reviews, and security changes.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
            <tr>
              <th className="py-3 px-4">Timestamp</th>
              <th className="py-3 px-4">Action</th>
              <th className="py-3 px-4">Details</th>
              <th className="py-3 px-4">User</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {activities.map((act) => (
              <tr key={act.id} className="hover:bg-slate-50">
                <td className="py-3 px-4 font-mono text-slate-500">{formatDateTime(act.createdAt)}</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    {act.action}
                  </span>
                </td>
                <td className="py-3 px-4 font-medium text-slate-800">{act.details}</td>
                <td className="py-3 px-4 text-slate-600">{act.userName || "System"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
