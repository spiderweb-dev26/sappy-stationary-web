"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Boxes, ShoppingCart, Receipt, CreditCard, BarChart3 } from "lucide-react";

export default function MobileNav() {
  const pathname = usePathname();
  if (pathname === "/login") return null;

  const items = [
    { name: "Inventory", href: "/inventory", icon: Boxes },
    { name: "POS", href: "/sales", icon: ShoppingCart },
    { name: "Expenses", href: "/expenses", icon: Receipt },
    { name: "Credits", href: "/credits", icon: CreditCard },
    { name: "Reports", href: "/reports", icon: BarChart3 },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-emerald-950/95 backdrop-blur-md border-t border-emerald-900/80 px-2 py-1.5 flex items-center justify-around">
      {items.map((it) => {
        const isActive = pathname.startsWith(it.href);
        const Icon = it.icon;
        return (
          <Link
            key={it.name}
            href={it.href}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
              isActive
                ? "text-mint-300 font-bold"
                : "text-emerald-400/80 hover:text-emerald-200"
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] tracking-tight">{it.name}</span>
          </Link>
        );
      })}
    </div>
  );
}
