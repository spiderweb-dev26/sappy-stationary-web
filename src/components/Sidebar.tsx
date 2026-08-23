"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Boxes,
  ShoppingCart,
  Receipt,
  CreditCard,
  Truck,
  BarChart3,
  History,
  LogOut,
  User,
  ShieldCheck,
  RotateCcw,
} from "lucide-react";
import BrandMark from "./BrandMark";
import ResetMaintenanceModal from "./ResetMaintenanceModal";

const NAV_ITEMS = [
  { name: "Inventory", href: "/inventory", icon: Boxes },
  { name: "POS / Sales", href: "/sales", icon: ShoppingCart },
  { name: "Expenses", href: "/expenses", icon: Receipt },
  { name: "Credit Book", href: "/credits", icon: CreditCard },
  { name: "Purchase Orders", href: "/purchase-orders", icon: Truck },
  { name: "Reports & P&L", href: "/reports", icon: BarChart3 },
  { name: "Activity Log", href: "/activity", icon: History },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  if (pathname === "/login") return null;

  return (
    <>
      <aside className="hidden md:flex flex-col w-64 bg-emerald-950 text-emerald-100 border-r border-emerald-900/60 shrink-0 h-screen sticky top-0">
        <div className="p-6 border-b border-emerald-900/60 flex items-center justify-between">
          <BrandMark />
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold text-emerald-400/70 uppercase tracking-widest">
            Store Operations
          </div>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-emerald-800 text-white shadow-md shadow-emerald-950/40 border border-emerald-700/50"
                    : "text-emerald-200/80 hover:bg-emerald-900/60 hover:text-white"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-mint-300" : "text-emerald-400"}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}

          <div className="pt-4 border-t border-emerald-900/50">
            <button
              type="button"
              onClick={() => setIsResetModalOpen(true)}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-rose-300/80 hover:bg-rose-950/40 hover:text-rose-200 transition-all duration-200"
            >
              <RotateCcw className="w-4 h-4 text-rose-400" />
              <span>System Reset</span>
            </button>
          </div>
        </nav>

        <div className="p-4 border-t border-emerald-900/60 bg-emerald-950/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-emerald-800 text-mint-200 flex items-center justify-center font-bold text-xs border border-emerald-700">
                <User className="w-4 h-4" />
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-white truncate">
                  {session?.user?.name || "Staff Cashier"}
                </p>
                <p className="text-[10px] text-emerald-300/80 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" /> Master-Protected
                </p>
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              title="Sign Out"
              className="p-1.5 rounded-lg text-emerald-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      <ResetMaintenanceModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onSuccess={() => {
          window.location.reload();
        }}
      />
    </>
  );
}