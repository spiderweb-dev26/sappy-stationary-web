"use client";

import React, { useState } from "react";
import {
  RotateCcw,
  CalendarCheck2,
  AlertOctagon,
  X,
  CheckCircle2,
  ShieldAlert,
  PackageCheck,
  CreditCard,
  Trash2,
  Lock,
} from "lucide-react";
import MasterModal from "./MasterModal";

interface ResetMaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ResetMaintenanceModal({
  isOpen,
  onClose,
  onSuccess,
}: ResetMaintenanceModalProps) {
  const [selectedResetMode, setSelectedResetMode] = useState<"YEAR_END" | "FULL_RESET" | null>(null);
  const [isMasterModalOpen, setIsMasterModalOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  if (!isOpen) return null;

  const handleInitiateReset = (mode: "YEAR_END" | "FULL_RESET") => {
    setSelectedResetMode(mode);
    setIsMasterModalOpen(true);
  };

  const handleMasterConfirm = async (password: string) => {
    if (!selectedResetMode) return;

    setFeedback(null);

    try {
      const res = await fetch("/api/system/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: selectedResetMode,
          masterPassword: password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Reset failed");
      }

      setFeedback({ msg: data.message, type: "success" });
      onSuccess?.();
      setTimeout(() => {
        setIsMasterModalOpen(false);
        setSelectedResetMode(null);
        onClose();
      }, 2000);
    } catch (err: any) {
      setFeedback({ msg: err.message || "Reset action failed", type: "error" });
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
        <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-6 sm:p-7 border border-slate-200 animate-scale-up space-y-5">
          <div className="flex items-start justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center border border-rose-200/80 shadow-sm">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-display font-black text-lg text-slate-900 leading-tight">
                  System Maintenance & Data Reset
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select a fiscal year-end rollover or a full factory clean slate reset.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {feedback && (
            <div
              className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
                feedback.type === "success"
                  ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                  : "bg-rose-50 text-rose-900 border-rose-200"
              }`}
            >
              {feedback.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-rose-700 shrink-0" />
              )}
              <span>{feedback.msg}</span>
            </div>
          )}

          <div className="space-y-3.5">
            {/* 1. Year-End Reset Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/70 border border-amber-200/90 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
                    <CalendarCheck2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-display font-black text-sm text-slate-900">
                      1. Year-End Fiscal Reset
                    </h4>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Clears annual sales tickets, expenses & purchase orders for the new fiscal year.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 text-[10px] font-bold">
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 flex items-center gap-1">
                  <PackageCheck className="w-3 h-3" /> Inventory Stock Intact
                </span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 flex items-center gap-1">
                  <CreditCard className="w-3 h-3" /> Customer Credits Intact
                </span>
                <span className="px-2 py-0.5 rounded-md bg-amber-200/80 text-amber-900">
                  Sales & Expenses Cleared
                </span>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleInitiateReset("YEAR_END")}
                  className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
                >
                  <CalendarCheck2 className="w-3.5 h-3.5" />
                  Run Year-End Reset
                </button>
              </div>
            </div>

            {/* 2. Full Clean Slate Reset Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-rose-50/70 border border-rose-200/90 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-900 flex items-center justify-center font-bold">
                    <AlertOctagon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-display font-black text-sm text-rose-950">
                      2. Full Factory Reset (Clean Slate)
                    </h4>
                    <p className="text-[11px] text-rose-800/90 mt-0.5">
                      Wipes all catalog items, sales history, expenses, credit accounts, and orders.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 text-[10px] font-bold">
                <span className="px-2 py-0.5 rounded-md bg-rose-200/90 text-rose-950">
                  All Inventory Wiped
                </span>
                <span className="px-2 py-0.5 rounded-md bg-rose-200/90 text-rose-950">
                  All Sales & Credits Wiped
                </span>
                <span className="px-2 py-0.5 rounded-md bg-rose-200/90 text-rose-950">
                  Irreversible Clean Slate
                </span>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleInitiateReset("FULL_RESET")}
                  className="flex items-center gap-1.5 px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-xl shadow-md shadow-rose-700/20 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Wipe Everything (Clean Slate)
                </button>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1 font-medium">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              Protected by the shop Master Password.
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      <MasterModal
        isOpen={isMasterModalOpen}
        title={
          selectedResetMode === "YEAR_END"
            ? "Authorize Year-End Fiscal Reset"
            : "Authorize Full Factory Reset"
        }
        description={
          selectedResetMode === "YEAR_END"
            ? "This will clear all sales, expense records, and purchase orders. Inventory catalog and customer credits will remain intact."
            : "WARNING: This will permanently wipe all inventory stock, sales, expenses, and credit notes to a zero clean slate."
        }
        onConfirm={handleMasterConfirm}
        onClose={() => {
          setIsMasterModalOpen(false);
          setSelectedResetMode(null);
        }}
      />
    </>
  );
}