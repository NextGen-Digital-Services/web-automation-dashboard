"use client";

import React from "react";
import { useDashboardState } from "@/lib/context/dashboard-state";
import { StatCard } from "@/components/dashboard/stat-card";
import { Link2, CheckCircle2, XCircle, TrendingUp, RefreshCw, Clock } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  const { stats, activities, analyticsData, submissions } = useDashboardState();

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Control Center
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1.5 text-sm md:text-base">
            Real-time status of your outreach & automation campaigns.
          </p>
        </div>
        {submissions.some((s) => s.status === "pending") && (
          <Badge variant="outline" className="flex items-center gap-1.5 self-start sm:self-center px-3 py-1 bg-violet-50 text-violet-700 dark:bg-violet-950/20 dark:text-violet-400 border-violet-200/50 animate-pulse">
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            <span>Simulating automation runs...</span>
          </Badge>
        )}
      </div>

      {/* Grid statistics */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        <StatCard
          title="Total Targets"
          value={stats.totalUrls}
          description="Registered target URL profiles"
          icon={Link2}
          trend={{ value: "+12.5%", type: "positive" }}
        />
        <StatCard
          title="Pending Targets"
          value={stats.pendingUrls}
          description="Awaiting outreach automation"
          icon={Clock}
          trend={{ value: "Active", type: "neutral" }}
        />
        <StatCard
          title="Completed Submissions"
          value={stats.successfulSubmissions}
          description="Forms successfully submitted"
          icon={CheckCircle2}
          trend={{ value: "+8.2%", type: "positive" }}
        />
        <StatCard
          title="Failed Submissions"
          value={stats.failedSubmissions}
          description="Form automated actions failed"
          icon={XCircle}
          trend={{ value: "-2.4%", type: "positive" }}
        />
        <StatCard
          title="Success Rate"
          value={`${stats.successRate}%`}
          description="Overall success score"
          icon={TrendingUp}
          trend={{ value: "+3.1%", type: "positive" }}
        />
      </div>

      {/* Chart & Recent Activity Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Analytics chart card */}
        <Card className="lg:col-span-2 border-zinc-200/80 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md">
          <CardHeader>
            <CardTitle>Automation Pipeline Trend</CardTitle>
            <CardDescription>
              Volume and completion status metrics over the past 7 days
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[320px] pr-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analyticsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSubmissions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-100 dark:stroke-zinc-800" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  className="text-xs text-zinc-400 dark:text-zinc-500 fill-current"
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  className="text-xs text-zinc-400 dark:text-zinc-500 fill-current"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    border: "1px solid #e4e4e7",
                    borderRadius: "8px",
                  }}
                  itemStyle={{ fontSize: "12px" }}
                  labelStyle={{ fontSize: "12px", fontWeight: "bold" }}
                />
                <Area
                  type="monotone"
                  dataKey="submissions"
                  name="Total Actions"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorSubmissions)"
                />
                <Area
                  type="monotone"
                  dataKey="success"
                  name="Succeeded"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorSuccess)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent activities list card */}
        <Card className="border-zinc-200/80 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md flex flex-col">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Chronological log of recent outreach actions
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto max-h-[320px]">
            <div className="space-y-4 relative pl-4 border-l border-zinc-200 dark:border-zinc-800 ml-2 py-1">
              {activities.length === 0 ? (
                <div className="text-center py-8 text-sm text-zinc-400">
                  No automated activity logs found.
                </div>
              ) : (
                activities.map((act) => (
                  <div key={act.id} className="relative group text-sm">
                    {/* Activity Indicator Dot */}
                    <div
                      className={`absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-zinc-950 ${
                        act.type === "success"
                          ? "bg-emerald-500"
                          : act.type === "failed"
                          ? "bg-rose-500"
                          : "bg-blue-500"
                      }`}
                    />
                    <div className="space-y-1">
                      <p className="font-medium text-zinc-800 dark:text-zinc-200 leading-snug">
                        {act.message}
                      </p>
                      <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500">
                        {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
