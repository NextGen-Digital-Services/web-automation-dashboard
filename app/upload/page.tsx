"use client";

import React, { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDashboardState } from "@/lib/context/dashboard-state";
import { submissionSchema, SubmissionFormValues } from "@/lib/validations/submission";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, AlertTriangle, ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function UploadPage() {
  const { addSubmission } = useDashboardState();
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<SubmissionFormValues>({
    resolver: zodResolver(submissionSchema),
    defaultValues: {
      websiteUrl: "",
      businessName: "",
      priority: "medium",
    },
  });

  const selectedPriority = useWatch({ control, name: "priority" });

  const onSubmit = (data: SubmissionFormValues) => {
    setIsSubmitting(true);
    
    // Simulate API request delay
    setTimeout(() => {
      addSubmission(data.websiteUrl, data.businessName, data.priority);
      setIsSubmitting(false);
      setSuccessMsg(`Successfully registered "${data.businessName}" for automation outreach.`);
      reset();
      
      // Auto-hide success alert
      setTimeout(() => setSuccessMsg(null), 5000);
    }, 1000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Target Automation Registry
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1.5 text-sm md:text-base">
          Queue new website domains for automated forms and outreach campaigns.
        </p>
      </div>

      {successMsg && (
        <Alert className="bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900/50 dark:text-emerald-450 animate-in slide-in-from-top-2">
          <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-500" />
          <AlertTitle className="font-semibold">Submission Queued</AlertTitle>
          <AlertDescription>{successMsg}</AlertDescription>
        </Alert>
      )}

      <Card className="border-zinc-200/80 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md shadow-sm">
        <CardHeader>
          <CardTitle>Automation Details</CardTitle>
          <CardDescription>
            Specify the company details and Priority level. The automation engine will prioritize based on selection.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-5">
            {/* Business Name Field */}
            <div className="space-y-2">
              <label htmlFor="businessName" className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Business / Client Name
              </label>
              <Input
                id="businessName"
                type="text"
                placeholder="e.g. Acme Corp"
                className={cn(
                  "h-10 bg-zinc-50/50 dark:bg-zinc-900/50 focus-visible:bg-white border-zinc-200 focus-visible:ring-1 focus-visible:ring-violet-600 rounded-lg dark:border-zinc-800",
                  errors.businessName && "border-rose-500 focus-visible:ring-rose-500"
                )}
                {...register("businessName")}
              />
              {errors.businessName && (
                <p className="text-xs text-rose-600 flex items-center gap-1 mt-1">
                  <AlertTriangle className="h-3 w-3 shrink-0" />
                  {errors.businessName.message}
                </p>
              )}
            </div>

            {/* Website URL Field */}
            <div className="space-y-2">
              <label htmlFor="websiteUrl" className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Website URL Target
              </label>
              <Input
                id="websiteUrl"
                type="text"
                placeholder="https://example.com"
                className={cn(
                  "h-10 bg-zinc-50/50 dark:bg-zinc-900/50 focus-visible:bg-white border-zinc-200 focus-visible:ring-1 focus-visible:ring-violet-600 rounded-lg dark:border-zinc-800",
                  errors.websiteUrl && "border-rose-500 focus-visible:ring-rose-500"
                )}
                {...register("websiteUrl")}
              />
              {errors.websiteUrl && (
                <p className="text-xs text-rose-600 flex items-center gap-1 mt-1">
                  <AlertTriangle className="h-3 w-3 shrink-0" />
                  {errors.websiteUrl.message}
                </p>
              )}
            </div>

            {/* Custom Priority Badges Field */}
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-3">
                Outreach Priority
              </span>
              <div className="grid grid-cols-3 gap-3">
                {(["low", "medium", "high"] as const).map((p) => {
                  const isActive = selectedPriority === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setValue("priority", p)}
                      className={cn(
                        "py-3 px-4 rounded-xl text-sm font-medium border capitalize transition-all select-none duration-250 cursor-pointer flex flex-col items-center gap-1.5",
                        p === "low" && (isActive 
                          ? "bg-slate-50 border-slate-400 text-slate-900 dark:bg-slate-900/40 dark:border-slate-700 dark:text-slate-200" 
                          : "bg-transparent border-zinc-200 text-zinc-500 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"),
                        p === "medium" && (isActive 
                          ? "bg-indigo-50 border-indigo-400 text-indigo-900 dark:bg-indigo-950/20 dark:border-indigo-900/50 dark:text-indigo-400" 
                          : "bg-transparent border-zinc-200 text-zinc-500 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"),
                        p === "high" && (isActive 
                          ? "bg-amber-50 border-amber-400 text-amber-900 dark:bg-amber-950/20 dark:border-amber-900/50 dark:text-amber-400" 
                          : "bg-transparent border-zinc-200 text-zinc-500 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700")
                      )}
                    >
                      <span className={cn(
                        "h-2 w-2 rounded-full",
                        p === "low" && "bg-slate-500",
                        p === "medium" && "bg-indigo-500",
                        p === "high" && "bg-amber-500"
                      )} />
                      <span>{p}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>

          <CardFooter className="pt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-lg px-5 cursor-pointer font-medium"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registering...
                </>
              ) : (
                <>
                  Register Automation Target
                  <ArrowRight className="ml-2 h-4.5 w-4.5" />
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
