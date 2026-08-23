import React from "react";
import Link from "next/link";
import { Boxes, ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 bg-cream-100 text-slate-900 text-center">
      <div className="w-14 h-14 rounded-3xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-4">
        <Boxes className="w-7 h-7" />
      </div>
      <h1 className="font-display font-black text-3xl text-slate-900">404 - Page Not Found</h1>
      <p className="text-xs text-slate-500 mt-2 max-w-sm">
        The page or stationery item you requested does not exist or has been moved.
      </p>
      <Link
        href="/inventory"
        className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition-all"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Inventory</span>
      </Link>
    </div>
  );
}