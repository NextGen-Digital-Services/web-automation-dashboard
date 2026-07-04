"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Upload,
  FileText,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const menuItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "URL Upload", href: "/upload", icon: Upload },
  { name: "Reports", href: "/reports", icon: FileText },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile Menu Trigger Bar */}
      <div className="flex md:hidden items-center justify-between px-4 py-3 bg-white/70 backdrop-blur-md border-b border-zinc-200/80 sticky top-0 z-40 dark:bg-black/70 dark:border-zinc-800/80">
        <div className="flex items-center gap-2">
          <span className="h-8 w-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-indigo-500/20">
            W
          </span>
          <span className="font-semibold text-zinc-900 dark:text-zinc-50 tracking-tight">
            NextGen WebAuto
          </span>
        </div>
        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetTrigger render={
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Menu className="h-5 w-5" />
            </Button>
          } />
          <SheetContent side="left" className="w-72 p-0 bg-white dark:bg-zinc-950 border-r border-zinc-200/80 dark:border-zinc-800/80">
            <SheetHeader className="p-6 border-b border-zinc-200/80 dark:border-zinc-800/80 text-left">
              <SheetTitle className="flex items-center gap-2">
                <span className="h-8 w-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-indigo-500/20">
                  W
                </span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-50 tracking-tight">
                  NextGen WebAuto
                </span>
              </SheetTitle>
            </SheetHeader>
            <div className="px-3 py-4 flex flex-col gap-1.5">
              {menuItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-indigo-500/10"
                        : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
                    )}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col border-r border-zinc-200/80 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-xl h-screen sticky top-0 z-30 transition-all duration-300 ease-in-out select-none",
          isCollapsed ? "w-20" : "w-64"
        )}
      >
        {/* Header Logo */}
        <div className="h-[73px] flex items-center justify-between px-6 border-b border-zinc-200/80 dark:border-zinc-800/80">
          <div className="flex items-center gap-3 overflow-hidden">
            <span className="h-9 w-9 shrink-0 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-md shadow-indigo-500/25">
              W
            </span>
            {!isCollapsed && (
              <span className="font-semibold text-zinc-900 dark:text-zinc-50 tracking-tight text-base animate-in fade-in duration-300">
                NextGen WebAuto
              </span>
            )}
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 px-3 py-6 flex flex-col gap-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center rounded-xl text-sm font-medium transition-all duration-200 relative group",
                  isCollapsed ? "justify-center p-3" : "gap-3.5 px-4 py-3",
                  isActive
                    ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-indigo-500/15"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!isCollapsed && <span className="animate-in fade-in duration-200">{item.name}</span>}

                {/* Collapsed Tooltip */}
                {isCollapsed && (
                  <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-zinc-900 text-zinc-50 text-xs rounded-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 shadow-lg whitespace-nowrap z-50 dark:bg-zinc-850">
                    {item.name}
                  </div>
                )}
              </Link>
            );
          })}
        </div>

        {/* Collapsible toggle footer */}
        <div className="p-4 border-t border-zinc-200/80 dark:border-zinc-800/80 flex justify-end">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-9 w-9 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500"
          >
            {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </Button>
        </div>
      </aside>
    </>
  );
}
