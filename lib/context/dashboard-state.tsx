"use client";

import React, { createContext, useContext } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { URLSubmission, DashboardStats, AnalyticsTrendPoint, RecentActivity } from "@/types";

interface DashboardStateContextType {
  submissions: URLSubmission[];
  stats: DashboardStats;
  activities: RecentActivity[];
  analyticsData: AnalyticsTrendPoint[];
  addSubmission: (url: string, businessName: string, priority: 'low' | 'medium' | 'high') => void;
  deleteSubmission: (id: string) => void;
  clearAll: () => void;
}

const DashboardStateContext = createContext<DashboardStateContextType | undefined>(undefined);

export function DashboardStateProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  // Query submissions list from server
  const { data: submissions = [] } = useQuery<URLSubmission[]>({
    queryKey: ["submissions"],
    queryFn: async () => {
      const response = await fetch("/api/urls");
      if (!response.ok) throw new Error("Failed to fetch URLs");
      return response.json();
    },
    // Poll the backend every 3 seconds if any submission is in a 'pending' state
    refetchInterval: (query) => {
      const data = query.state.data as URLSubmission[] | undefined;
      return data?.some((s) => s.status === "pending") ? 3000 : false;
    },
  });



  // Mutation: Create a new outreach submission
  const addSubmissionMutation = useMutation({
    mutationFn: async (newSub: { websiteUrl: string; businessName: string; priority: string }) => {
      const response = await fetch("/api/urls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSub),
      });
      if (!response.ok) throw new Error("Failed to create URL submission");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["submissions"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });

  // Mutation: Delete an outreach submission
  const deleteSubmissionMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/urls/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete submission");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["submissions"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });

  const addSubmission = (url: string, businessName: string, priority: 'low' | 'medium' | 'high') => {
    addSubmissionMutation.mutate({ websiteUrl: url, businessName, priority });
  };

  const deleteSubmission = (id: string) => {
    deleteSubmissionMutation.mutate(id);
  };

  const clearAll = () => {
    // Clear in-memory client queries (REST side requires direct deletes)
    queryClient.setQueriesData({ queryKey: ["submissions"] }, []);
    queryClient.setQueriesData({ queryKey: ["reports"] }, []);
  };

  // Stats calculation based on backend records
  const totalUrls = submissions.length;
  const successfulSubmissions = submissions.filter((s) => s.status === "success").length;
  const failedSubmissions = submissions.filter((s) => s.status === "failed").length;
  const successRate = totalUrls > 0 
    ? Math.round((successfulSubmissions / (successfulSubmissions + failedSubmissions || 1)) * 100) 
    : 0;

  const stats: DashboardStats = {
    totalUrls,
    successfulSubmissions,
    failedSubmissions,
    successRate,
  };

  // Generate recent activities based on actual database submissions and reports
  const getActivities = (): RecentActivity[] => {
    const list: RecentActivity[] = [];

    submissions.forEach((sub) => {
      // Creation log
      list.push({
        id: `upload-${sub.id}`,
        type: "upload",
        message: `Registered outreach target: ${sub.businessName} (${sub.websiteUrl})`,
        timestamp: sub.createdAt,
      });

      // Automation results log
      if (sub.status === "success") {
        list.push({
          id: `success-${sub.id}`,
          type: "success",
          message: `Successfully automated outreach contact form for ${sub.businessName}`,
          timestamp: sub.updatedAt,
        });
      } else if (sub.status === "failed") {
        list.push({
          id: `failed-${sub.id}`,
          type: "failed",
          message: `Failed contact automation for ${sub.businessName} (form timeout)`,
          timestamp: sub.updatedAt,
        });
      }
    });

    // Sort by timestamp desc
    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const activities = getActivities();

  // Recharts Analytics data (grouped by date)
  const getAnalyticsData = (): AnalyticsTrendPoint[] => {
    const map = new Map<string, { submissions: number; success: number; failed: number }>();
    
    // Add default fallbacks for last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      map.set(dateString, { submissions: 0, success: 0, failed: 0 });
    }

    submissions.forEach((sub) => {
      const dateString = new Date(sub.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const current = map.get(dateString) || { submissions: 0, success: 0, failed: 0 };
      current.submissions += 1;
      if (sub.status === "success") current.success += 1;
      if (sub.status === "failed") current.failed += 1;
      map.set(dateString, current);
    });

    return Array.from(map.entries()).map(([date, counts]) => ({
      date,
      ...counts,
    }));
  };

  const analyticsData = getAnalyticsData();

  return (
    <DashboardStateContext.Provider
      value={{
        submissions,
        stats,
        activities,
        analyticsData,
        addSubmission,
        deleteSubmission,
        clearAll,
      }}
    >
      {children}
    </DashboardStateContext.Provider>
  );
}

export function useDashboardState() {
  const context = useContext(DashboardStateContext);
  if (context === undefined) {
    throw new Error("useDashboardState must be used within a DashboardStateProvider");
  }
  return context;
}
