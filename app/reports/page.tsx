"use client";

import React, { useState } from "react";
import { useDashboardState } from "@/lib/context/dashboard-state";
import { useQuery } from "@tanstack/react-query";
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
  Eye,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function ReportsPage() {
  const { submissions, deleteSubmission } = useDashboardState();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const itemsPerPage = 6;

  // Query actual automation runs from the server
  const { data: runs = [] } = useQuery<any[]>({
    queryKey: ["runs"],
    queryFn: async () => {
      const response = await fetch("/api/runs");
      if (!response.ok) throw new Error("Failed to fetch runs");
      return response.json();
    },
    refetchInterval: 3000, // Poll every 3 seconds
  });

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

  const handleRowClick = (sub: any) => {
    const associatedRun = runs.find((r) => r.submissionId === sub.id);
    setSelectedSubmission({
      ...sub,
      run: associatedRun,
    });
    setDialogOpen(true);
  };

  const formatDateTime = (dateStr: string | undefined | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
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
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-zinc-50/50 dark:bg-zinc-900/50">
              <TableRow className="hover:bg-transparent border-zinc-200/80 dark:border-zinc-800/80">
                <TableHead className="font-semibold text-zinc-600 dark:text-zinc-400">Business Target</TableHead>
                <TableHead className="font-semibold text-zinc-600 dark:text-zinc-400">Started At</TableHead>
                <TableHead className="font-semibold text-zinc-600 dark:text-zinc-400">Completed At</TableHead>
                <TableHead className="font-semibold text-zinc-600 dark:text-zinc-400">Execution Time</TableHead>
                <TableHead className="font-semibold text-zinc-600 dark:text-zinc-400">Status</TableHead>
                <TableHead className="font-semibold text-zinc-600 dark:text-zinc-400">Proof</TableHead>
                <TableHead className="font-semibold text-zinc-600 dark:text-zinc-400">Screenshot</TableHead>
                <TableHead className="font-semibold text-zinc-600 dark:text-zinc-400">Failure Reason</TableHead>
                <TableHead className="font-semibold text-zinc-650 dark:text-zinc-400 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedItems.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={9} className="h-40 text-center text-zinc-400 dark:text-zinc-500 font-medium">
                    No outreach logs found matching query filters.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedItems.map((sub) => {
                  const associatedRun = runs.find((r) => r.submissionId === sub.id);
                  return (
                    <TableRow
                      key={sub.id}
                      onClick={() => handleRowClick(sub)}
                      className="hover:bg-zinc-50/40 dark:hover:bg-zinc-900/40 border-zinc-200/60 dark:border-zinc-850 cursor-pointer"
                    >
                      <TableCell className="font-semibold text-zinc-900 dark:text-zinc-100">
                        <div className="space-y-0.5">
                          <div>{sub.businessName}</div>
                          <div className="text-xs text-zinc-450 dark:text-zinc-500 font-normal truncate max-w-[150px]">
                            {sub.websiteUrl.replace(/^https?:\/\/(www\.)?/, "")}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                        {formatDateTime(associatedRun?.startedAt)}
                      </TableCell>
                      <TableCell className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                        {formatDateTime(associatedRun?.completedAt)}
                      </TableCell>
                      <TableCell className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                        {associatedRun?.executionTimeMs
                          ? `${(associatedRun.executionTimeMs / 1000).toFixed(2)}s`
                          : "-"}
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
                      <TableCell className="text-xs text-zinc-550 dark:text-zinc-400 font-medium max-w-[120px] truncate">
                        {associatedRun?.submissionProof || "-"}
                      </TableCell>
                      <TableCell>
                        {associatedRun?.screenshotAfter ? (
                          <Badge variant="outline" className="bg-emerald-50/50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-450 border-emerald-250">
                            Available
                          </Badge>
                        ) : (
                          <span className="text-xs text-zinc-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-rose-600 dark:text-rose-400 font-medium max-w-[125px] truncate">
                        {associatedRun?.failureReason || "-"}
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
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
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

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

      {/* Row details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              Execution Log: {selectedSubmission?.businessName}
            </DialogTitle>
            <DialogDescription className="text-sm text-zinc-400">
              Complete tracer log and form filling metrics.
            </DialogDescription>
          </DialogHeader>

          {selectedSubmission && (
            <div className="space-y-6 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-zinc-50 dark:bg-zinc-900/60 p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-850">
                <div>
                  <span className="font-semibold text-zinc-550 dark:text-zinc-400">Website URL: </span>
                  <a
                    href={selectedSubmission.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-violet-650 hover:underline inline-flex items-center gap-1"
                  >
                    {selectedSubmission.websiteUrl} <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <div>
                  <span className="font-semibold text-zinc-550 dark:text-zinc-400">Status: </span>
                  <span className={`capitalize font-semibold ${selectedSubmission.status === "success" ? "text-emerald-600" : "text-rose-600"}`}>
                    {selectedSubmission.status}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-zinc-550 dark:text-zinc-400">Started At: </span>
                  <span>{formatDateTime(selectedSubmission.run?.startedAt)}</span>
                </div>
                <div>
                  <span className="font-semibold text-zinc-550 dark:text-zinc-400">Completed At: </span>
                  <span>{formatDateTime(selectedSubmission.run?.completedAt)}</span>
                </div>
                <div>
                  <span className="font-semibold text-zinc-550 dark:text-zinc-400">Execution Time: </span>
                  <span>
                    {selectedSubmission.run?.executionTimeMs
                      ? `${(selectedSubmission.run.executionTimeMs / 1000).toFixed(2)}s`
                      : "-"}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-zinc-550 dark:text-zinc-400">Priority: </span>
                  <span className="capitalize">{selectedSubmission.priority}</span>
                </div>
              </div>

              {selectedSubmission.run?.submissionProof && (
                <div className="space-y-1.5">
                  <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">Submission Proof</h4>
                  <pre className="text-xs bg-zinc-50 dark:bg-zinc-900 p-3 rounded-lg border border-zinc-200 dark:border-zinc-850 overflow-x-auto text-zinc-650 dark:text-zinc-405 whitespace-pre-wrap">
                    {selectedSubmission.run.submissionProof}
                  </pre>
                </div>
              )}

              {selectedSubmission.run?.failureReason && (
                <div className="space-y-1.5">
                  <h4 className="font-bold text-rose-600 text-sm">Failure Reason</h4>
                  <p className="text-xs bg-rose-50/50 dark:bg-rose-950/10 p-3 rounded-lg border border-rose-200/50 text-rose-700 dark:text-rose-400">
                    {selectedSubmission.run.failureReason}
                  </p>
                </div>
              )}

              {selectedSubmission.run?.filledFields && (
                <div className="space-y-1.5">
                  <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">Filled Form Values</h4>
                  <div className="grid grid-cols-2 gap-2 bg-zinc-50 dark:bg-zinc-900 p-3 rounded-lg border border-zinc-200 dark:border-zinc-850">
                    {Object.entries(selectedSubmission.run.filledFields).map(([key, val]: [string, any]) => (
                      <div key={key} className="text-xs flex justify-between border-b border-zinc-100 dark:border-zinc-800 pb-1.5">
                        <span className="font-medium text-zinc-400">{key}:</span>
                        <span className="font-semibold text-zinc-700 dark:text-zinc-300">{String(val)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* View Screenshots */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedSubmission.run?.screenshotBefore && (
                  <div className="space-y-2">
                    <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">Screenshot Before Fill</h4>
                    <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                      <img
                        src={`/api/screenshot/${selectedSubmission.id}?type=before`}
                        alt="Screenshot Before"
                        className="w-full h-auto object-cover"
                      />
                    </div>
                  </div>
                )}
                {selectedSubmission.run?.screenshotAfter && (
                  <div className="space-y-2">
                    <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">Screenshot After Submission</h4>
                    <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                      <img
                        src={`/api/screenshot/${selectedSubmission.id}?type=after`}
                        alt="Screenshot After"
                        className="w-full h-auto object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
