"use client";

import React, { useState } from "react";
import { useDashboardState } from "@/lib/context/dashboard-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  Trash2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ReportsPage() {
  const { submissions, deleteSubmission } = useDashboardState();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Filter and search logic
  const filteredSubmissions = submissions.filter((sub) => {
    const matchesSearch =
      sub.businessName.toLowerCase().includes(search.toLowerCase()) ||
      sub.websiteUrl.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || sub.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || sub.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredSubmissions.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = filteredSubmissions.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Outreach Logs & Reports
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1.5 text-sm md:text-base">
          Track form completion status, priority targets, and execution logs.
        </p>
      </div>

      {/* Filters and search header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/40 dark:bg-zinc-900/40 p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 backdrop-blur-md">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Search business or URL..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-9 h-10 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus-visible:bg-white rounded-xl"
          />
        </div>

        {/* Action filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-zinc-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-10 px-3 pr-8 text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-violet-600 cursor-pointer select-none"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <select
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="h-10 px-3 pr-8 text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-violet-600 cursor-pointer select-none"
          >
            <option value="all">All Priorities</option>
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
          </select>
        </div>
      </div>

      {/* Main Table view */}
      <div className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-zinc-50/50 dark:bg-zinc-900/50">
            <TableRow className="hover:bg-transparent border-zinc-200/80 dark:border-zinc-800/80">
              <TableHead className="font-semibold text-zinc-600 dark:text-zinc-400">Business Target</TableHead>
              <TableHead className="font-semibold text-zinc-600 dark:text-zinc-400">Website URL</TableHead>
              <TableHead className="font-semibold text-zinc-600 dark:text-zinc-400">Priority</TableHead>
              <TableHead className="font-semibold text-zinc-600 dark:text-zinc-400">Status</TableHead>
              <TableHead className="font-semibold text-zinc-600 dark:text-zinc-400">Registered At</TableHead>
              <TableHead className="font-semibold text-zinc-650 dark:text-zinc-400 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedItems.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="h-40 text-center text-zinc-400 dark:text-zinc-500 font-medium">
                  No outreach logs found matching query filters.
                </TableCell>
              </TableRow>
            ) : (
              paginatedItems.map((sub) => (
                <TableRow
                  key={sub.id}
                  className="hover:bg-zinc-50/40 dark:hover:bg-zinc-900/40 border-zinc-200/60 dark:border-zinc-850"
                >
                  <TableCell className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {sub.businessName}
                  </TableCell>
                  <TableCell className="font-medium text-zinc-500 dark:text-zinc-400 max-w-[200px] truncate">
                    <a
                      href={sub.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-indigo-600 transition-colors inline-flex items-center gap-1.5"
                    >
                      {sub.websiteUrl.replace(/^https?:\/\/(www\.)?/, "")}
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`capitalize px-2.5 py-0.5 rounded-full font-semibold border-none select-none text-[11px] ${
                        sub.priority === "high"
                          ? "bg-amber-100 text-amber-850 dark:bg-amber-950/20 dark:text-amber-400"
                          : sub.priority === "medium"
                          ? "bg-indigo-100 text-indigo-850 dark:bg-indigo-950/20 dark:text-indigo-400"
                          : "bg-slate-100 text-slate-850 dark:bg-slate-900/40 dark:text-slate-400"
                      }`}
                    >
                      {sub.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {sub.status === "success" && (
                        <>
                          <CheckCircle className="h-4.5 w-4.5 text-emerald-500" />
                          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Success</span>
                        </>
                      )}
                      {sub.status === "failed" && (
                        <>
                          <XCircle className="h-4.5 w-4.5 text-rose-500" />
                          <span className="text-xs font-semibold text-rose-700 dark:text-rose-400">Failed</span>
                        </>
                      )}
                      {sub.status === "pending" && (
                        <>
                          <Clock className="h-4.5 w-4.5 text-slate-400 animate-pulse" />
                          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Pending</span>
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                    {new Date(sub.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteSubmission(sub.id)}
                      className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination controls footer */}
        <div className="px-6 py-4 bg-zinc-50/50 dark:bg-zinc-900/50 border-t border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Showing {filteredSubmissions.length > 0 ? startIndex + 1 : 0} to{" "}
            {Math.min(startIndex + itemsPerPage, filteredSubmissions.length)} of{" "}
            {filteredSubmissions.length} targets
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
              className="h-8 w-8 rounded-lg cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs font-semibold px-3 text-zinc-700 dark:text-zinc-300">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
              className="h-8 w-8 rounded-lg cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
