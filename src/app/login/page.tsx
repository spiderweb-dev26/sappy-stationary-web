"use client";

import React, { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Lock,
  Mail,
  ArrowRight,
  UserPlus,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import BrandMark from "@/components/BrandMark";
import ProgressBar from "@/components/ProgressBar";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter both email and password.");
      setLoading(false);
      return;
    }

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: email.toLowerCase().trim(),
        password: password.trim(),
      });

      if (res?.error || !res?.ok) {
        setError("Invalid email or password. Please verify your credentials or register a new account.");
        setLoading(false);
      } else {
        router.push("/inventory");
        router.refresh();
      }
    } catch (err: any) {
      setError("An unexpected authentication error occurred.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 bg-cream-100 text-slate-900 selection:bg-emerald-200">
      <div className="max-w-md w-full space-y-6">
        {/* Brand Header with Green SAPPY text */}
        <div className="text-center space-y-3 flex flex-col items-center">
          <BrandMark lightMode={true} />
          <p className="text-xs text-slate-500 font-medium max-w-xs">
            Shared multi-user inventory, barcode/QR catalog, and POS management.
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200/80 p-6 sm:p-8 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="font-display font-black text-lg text-slate-900">
                Administrator Sign In
              </h2>
              <p className="text-xs text-slate-500">Access the shared store database</p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-700" /> Admin
            </span>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 flex items-start gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="py-6 space-y-3">
              <ProgressBar label="Authenticating credentials..." durationMs={1000} />
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. amanuealhailu007@gmail.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-display font-black text-sm rounded-2xl shadow-lg shadow-emerald-700/20 flex items-center justify-center gap-2 transition-all"
              >
                <ArrowRight className="w-4 h-4" />
                <span>Sign In to Sappy</span>
              </button>
            </form>
          )}

          <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
            <span>New administrator?</span>
            <Link
              href="/register"
              className="font-bold text-emerald-800 hover:underline flex items-center gap-1"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create Account</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}