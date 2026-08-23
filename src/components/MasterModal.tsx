"use client";

import React, { useState, useEffect } from "react";
import { ShieldAlert, KeyRound, X, Loader2, Lock } from "lucide-react";

interface MasterModalProps {
  isOpen: boolean;
  mode?: "verify" | "set";
  title?: string;
  description?: string;
  onConfirm: (password: string) => Promise<void> | void;
  onClose: () => void;
}

export default function MasterModal({
  isOpen,
  mode = "verify",
  title = "Master Authorization Required",
  description = "This destructive operation is protected by the shop master password.",
  onConfirm,
  onClose,
}: MasterModalProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSettingMode, setIsSettingMode] = useState(mode === "set");

  useEffect(() => {
    setIsSettingMode(mode === "set");
    setPassword("");
    setConfirmPassword("");
    setError("");
  }, [mode, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError("Please enter the master password.");
      return;
    }

    if (isSettingMode && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (isSettingMode) {
        const res = await fetch("/api/master/set", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ newPassword: password, currentPassword: password }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to set master password");
        }
      } else {
        const res = await fetch("/api/master/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Invalid master password");
        }
      }

      await onConfirm(password);
      setPassword("");
      setConfirmPassword("");
      onClose();
    } catch (err: any) {
      setError(err.message || "Authorization failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-7 border border-slate-200 animate-scale-up space-y-4">
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-black text-lg text-slate-900 leading-tight">
                {isSettingMode ? "Set Master Password" : title}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">{description}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-xl hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {isSettingMode ? "New Master Password" : "Enter Master Password"}
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                autoFocus
                placeholder={isSettingMode ? "Enter new password (min 4 chars)" : "Master password (default: sappy2026)"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {isSettingMode && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Confirm Master Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  placeholder="Repeat master password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          {error && <p className="text-xs text-rose-600 font-semibold mt-1">{error}</p>}

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-md shadow-emerald-700/20 disabled:opacity-50"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {isSettingMode ? "Set Password" : "Verify & Authorize"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}