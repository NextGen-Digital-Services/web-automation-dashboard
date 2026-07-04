import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: {
    value: string;
    type: "positive" | "negative" | "neutral";
  };
  className?: string;
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
}: StatCardProps) {
  return (
    <Card className={cn("overflow-hidden border border-zinc-200/80 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/5 hover:-translate-y-0.5", className)}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 tracking-wide uppercase">
              {title}
            </p>
            <h3 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
              {value}
            </h3>
          </div>
          <span className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
            <Icon className="h-5 w-5" />
          </span>
        </div>

        {(description || trend) && (
          <div className="flex items-center gap-2 mt-4 text-xs">
            {trend && (
              <span
                className={cn(
                  "flex items-center gap-0.5 font-semibold px-2 py-0.5 rounded-full",
                  trend.type === "positive" && "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400",
                  trend.type === "negative" && "bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400",
                  trend.type === "neutral" && "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
                )}
              >
                {trend.type === "positive" && <ArrowUpRight className="h-3 w-3 shrink-0" />}
                {trend.type === "negative" && <ArrowDownRight className="h-3 w-3 shrink-0" />}
                {trend.type === "neutral" && <Minus className="h-3 w-3 shrink-0" />}
                {trend.value}
              </span>
            )}
            {description && (
              <span className="text-zinc-450 dark:text-zinc-500 font-medium">
                {description}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
