"use client";

import React from "react";
import Link from "next/link";

export default function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/inventory" className="flex items-center gap-3 group select-none">
      <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-sm bg-white flex items-center justify-center border border-emerald-800/20 group-hover:scale-105 transition-transform duration-200 p-1">
        <img
          src="/favicon.png"
          alt="Sappy Stationery & Printing Logo"
          className="w-full h-full object-contain"
        />
      </div>
      {!compact && (
        <div className="flex flex-col">
          <span className="font-display font-black text-lg text-white tracking-widest leading-none group-hover:text-mint-300 transition-colors">
            SAPPY
          </span>
          <span className="text-[10px] font-medium text-emerald-300/90 lowercase tracking-normal leading-tight font-serif mt-0.5">
            stationery & printing.
          </span>
        </div>
      )}
    </Link>
  );
}