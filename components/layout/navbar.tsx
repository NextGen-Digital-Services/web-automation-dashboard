"use client";

import React from "react";
import { Search, Bell, User, CheckCircle2, XCircle, FilePlus2 } from "lucide-react";
import { useDashboardState } from "@/lib/context/dashboard-state";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

import { useSession, signOut } from "next-auth/react";

export function Navbar() {
  const { activities } = useDashboardState();
  const { data: session } = useSession();
  const unreadCount = activities.length;

  return (
    <header className="h-[73px] sticky top-0 z-20 flex items-center justify-between px-6 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800/80">
      {/* Search Input Bar */}
      <div className="relative w-full max-w-sm hidden sm:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
        <Input
          type="search"
          placeholder="Search submissions, reports, domains..."
          className="pl-9 h-9.5 w-full bg-zinc-50 border-zinc-200 focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-violet-600 transition-all rounded-lg dark:bg-zinc-900 dark:border-zinc-800"
        />
      </div>
      <div className="sm:hidden" /> {/* Spacer for mobile */}

      {/* Notifications & Profile controls */}
      <div className="flex items-center gap-3">
        {/* Notification Bell Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="relative h-9.5 w-9.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 hover:text-zinc-950 flex items-center justify-center dark:border-zinc-800 dark:hover:bg-zinc-900 transition-colors cursor-pointer select-none">
            <Bell className="h-4.5 w-4.5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-violet-600 ring-2 ring-white dark:ring-zinc-950" />
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-2">
            <DropdownMenuLabel className="px-3 py-2 flex items-center justify-between text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              <span>Activity Center</span>
              {unreadCount > 0 && (
                <span className="bg-violet-100 text-violet-700 dark:bg-violet-950/20 dark:text-violet-400 font-medium px-2 py-0.5 rounded-full text-[10px]">
                  {unreadCount} news
                </span>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-72 overflow-y-auto py-1 flex flex-col gap-1">
              {activities.length === 0 ? (
                <div className="text-center py-6 text-sm text-zinc-400 dark:text-zinc-500">
                  No notifications yet.
                </div>
              ) : (
                activities.slice(0, 5).map((act) => (
                  <div
                    key={act.id}
                    className="flex gap-2.5 p-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors text-xs text-left"
                  >
                    <div className="shrink-0 mt-0.5">
                      {act.type === "success" && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      )}
                      {act.type === "failed" && (
                        <XCircle className="h-4 w-4 text-rose-500" />
                      )}
                      {act.type === "upload" && (
                        <FilePlus2 className="h-4 w-4 text-blue-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-zinc-800 dark:text-zinc-200 leading-tight">
                        {act.message}
                      </p>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1 block">
                        {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Profile Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger className="h-9.5 w-9.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 hover:text-zinc-950 flex items-center justify-center overflow-hidden dark:border-zinc-800 dark:hover:bg-zinc-900 transition-colors cursor-pointer select-none">
            <User className="h-4.5 w-4.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-3 py-2 flex flex-col">
              <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                {session?.user?.name || "User"}
              </span>
              <span className="text-xs text-zinc-400 dark:text-zinc-500">
                {session?.user?.email || "user@saas.com"}
              </span>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">My Profile</DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">Billing & Subscription</DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">Integrations</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/20 cursor-pointer"
            >
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
