"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Boxes, ShoppingCart, Truck, BarChart3, Receipt } from "lucide-react";

export default function MobileNav() {
  const pathname = usePathname();
  if (pathname === "/login") return null;

  const tabs = [
    { name: "Home", href: "/dashboard", icon: LayoutDashboard },
    { name: "Stock", href: "/inventory", icon: Boxes },
    { name: "Sales", href: "/sales", icon: ShoppingCart },
    { name: "Orders", href: "/purchase-orders", icon: Truck },
    { name: "Reports", href: "/reports", icon: BarChart3 },
    { name: "Expenses", href: "/expenses", icon: Receipt },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-emerald-950/95 backdrop-blur-md border-t border-emerald-900/80 px-1 py-1 flex items-center justify-around">
      {tabs.map((tab) => {
        const isActive = pathname.startsWith(tab.href);
        const Icon = tab.icon;
        return (
          <Link
            key={tab.name}
            href={tab.href}
            className={`flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-xl transition-all ${
              isActive
                ? "text-mint-300 font-bold"
                : "text-emerald-400/70 hover:text-emerald-200"
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] tracking-tight">{tab.name}</span>
          </Link>
        );
      })}
    </div>
  );
}