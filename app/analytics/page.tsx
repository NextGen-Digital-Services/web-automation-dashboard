"use client";

import React from "react";
import { useDashboardState } from "@/lib/context/dashboard-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function AnalyticsPage() {
  const { analyticsData, submissions } = useDashboardState();

  // Status breakdown calculations
  const total = submissions.length;
  const success = submissions.filter((s) => s.status === "success").length;
  const failed = submissions.filter((s) => s.status === "failed").length;
  const pending = submissions.filter((s) => s.status === "pending").length;

  const statusPieData = [
    { name: "Succeeded", value: success, color: "#10b981" },
    { name: "Failed", value: failed, color: "#f43f5e" },
    { name: "Pending", value: pending, color: "#94a3b8" },
  ].filter((item) => item.value > 0);

  // Priority distribution calculations
  const lowP = submissions.filter((s) => s.priority === "low").length;
  const medP = submissions.filter((s) => s.priority === "medium").length;
  const highP = submissions.filter((s) => s.priority === "high").length;

  const priorityBarData = [
    { name: "Low Priority", count: lowP, fill: "#64748b" },
    { name: "Medium Priority", count: medP, fill: "#6366f1" },
    { name: "High Priority", count: highP, fill: "#f59e0b" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Campaign Analytics
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1.5 text-sm md:text-base">
          Deconstruct outreach metrics, automation performance, and failure rates.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Submission Trend Area Chart */}
        <Card className="border-zinc-200/80 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md">
          <CardHeader>
            <CardTitle>Daily Submission Volume</CardTitle>
            <CardDescription>Target URLs processed daily</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px] pr-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analyticsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSub" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-150 dark:stroke-zinc-800" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} className="text-xs text-zinc-400 dark:text-zinc-500 fill-current" />
                <YAxis tickLine={false} axisLine={false} className="text-xs text-zinc-400 dark:text-zinc-500 fill-current" />
                <Tooltip />
                <Area type="monotone" dataKey="submissions" name="Submissions" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorSub)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Success vs Failure Bar Chart */}
        <Card className="border-zinc-200/80 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md">
          <CardHeader>
            <CardTitle>Outreach Outcomes</CardTitle>
            <CardDescription>Succeeded vs failed automation steps</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px] pr-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-150 dark:stroke-zinc-800" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} className="text-xs text-zinc-400 dark:text-zinc-500 fill-current" />
                <YAxis tickLine={false} axisLine={false} className="text-xs text-zinc-400 dark:text-zinc-500 fill-current" />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                <Bar dataKey="success" name="Succeeded" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="failed" name="Failed" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie Chart: Status Distribution */}
        <Card className="border-zinc-200/80 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md">
          <CardHeader>
            <CardTitle>Status Breakdown</CardTitle>
            <CardDescription>Distribution of active outreach runs</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px] flex items-center justify-center">
            {total === 0 ? (
              <p className="text-sm text-zinc-450 dark:text-zinc-500">No data available</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} runs`]} />
                  <Legend formatter={(value) => <span className="text-xs text-zinc-600 dark:text-zinc-450">{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Bar Chart: Priority Distribution */}
        <Card className="border-zinc-200/80 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md">
          <CardHeader>
            <CardTitle>Priority Concentration</CardTitle>
            <CardDescription>Division of target levels</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px] pr-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-150 dark:stroke-zinc-800" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} className="text-xs text-zinc-400 dark:text-zinc-500 fill-current" />
                <YAxis tickLine={false} axisLine={false} className="text-xs text-zinc-400 dark:text-zinc-500 fill-current" />
                <Tooltip formatter={(value) => [`${value} sites`]} />
                <Bar dataKey="count" name="Target Count" fill="#6366f1" radius={[4, 4, 0, 0]}>
                  {priorityBarData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
