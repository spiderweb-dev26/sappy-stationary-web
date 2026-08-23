"use client";

import React, { useState, useEffect } from "react";

interface ProgressBarProps {
  label?: string;
  durationMs?: number;
  onComplete?: () => void;
  className?: string;
}

export default function ProgressBar({
  label = "Loading store data...",
  durationMs = 800,
  onComplete,
  className = "",
}: ProgressBarProps) {
  const [progress, setProgress] = useState(12);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.floor((elapsed / durationMs) * 100));
      setProgress((prev) => Math.max(prev, pct));

      if (pct >= 100) {
        clearInterval(interval);
        onComplete?.();
      }
    }, 30);

    return () => clearInterval(interval);
  }, [durationMs]);

  return (
    <div className={`w-full max-w-sm mx-auto p-4 flex flex-col items-center justify-center space-y-3 ${className}`}>
      <div className="flex items-center justify-between w-full text-xs font-bold text-slate-700">
        <span>{label}</span>
        <span className="font-mono text-emerald-800 text-sm font-black">{progress}%</span>
      </div>

      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200/80 p-0.5 shadow-inner">
        <div
          className="h-full bg-gradient-to-r from-emerald-600 via-emerald-500 to-mint-400 rounded-full transition-all duration-75 shadow-sm"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}