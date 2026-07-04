"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Bell, User, Layout, Save, Check } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function SettingsPage() {
  const [profile, setProfile] = useState({
    name: "Fahad",
    email: "administrator@saas.com",
    company: "NextGen Digital Services",
  });
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Preferences & Settings
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1.5 text-sm md:text-base">
          Configure platform options, user profiles, and outreach alerts.
        </p>
      </div>

      {saved && (
        <Alert className="bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900/50 dark:text-emerald-450 animate-in slide-in-from-top-2">
          <Check className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-500" />
          <AlertTitle className="font-semibold">Preferences Saved</AlertTitle>
          <AlertDescription>Your configurations have been successfully updated.</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Profile Settings */}
        <Card className="border-zinc-200/80 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center gap-3">
            <span className="p-2.5 rounded-xl bg-violet-50 text-violet-650 dark:bg-violet-950/40 dark:text-violet-400">
              <User className="h-5 w-5" />
            </span>
            <div>
              <CardTitle>Profile Details</CardTitle>
              <CardDescription>Update your personal information and organization name</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Administrator Name</label>
                <Input
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="h-10 bg-zinc-50/50 dark:bg-zinc-900/50 focus-visible:bg-white rounded-lg border-zinc-250 dark:border-zinc-800"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Corporate Email</label>
                <Input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="h-10 bg-zinc-50/50 dark:bg-zinc-900/50 focus-visible:bg-white rounded-lg border-zinc-250 dark:border-zinc-800"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Organization Name</label>
              <Input
                value={profile.company}
                onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                className="h-10 bg-zinc-50/50 dark:bg-zinc-900/50 focus-visible:bg-white rounded-lg border-zinc-250 dark:border-zinc-800"
              />
            </div>
          </CardContent>
        </Card>

        {/* Application Preferences */}
        <Card className="border-zinc-200/80 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center gap-3">
            <span className="p-2.5 rounded-xl bg-violet-50 text-violet-650 dark:bg-violet-950/40 dark:text-violet-400">
              <Layout className="h-5 w-5" />
            </span>
            <div>
              <CardTitle>Application Preferences</CardTitle>
              <CardDescription>Manage how the control center performs tasks</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-zinc-800/80">
              <div className="space-y-0.5">
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Theme Preference</span>
                <p className="text-xs text-zinc-550 dark:text-zinc-450">Select interface mode color</p>
              </div>
              <select className="h-9 px-3 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg cursor-pointer">
                <option value="system">Follow System</option>
                <option value="light">Light Mode</option>
                <option value="dark">Dark Mode</option>
              </select>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-zinc-800/80">
              <div className="space-y-0.5">
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Automation Speed</span>
                <p className="text-xs text-zinc-550 dark:text-zinc-450">Throttling configuration for Playwright engine</p>
              </div>
              <select className="h-9 px-3 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg cursor-pointer">
                <option value="normal">Normal (Recommended)</option>
                <option value="fast">Aggressive (Speed run)</option>
                <option value="slow">Stealthy (Human-like delays)</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card className="border-zinc-200/80 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center gap-3">
            <span className="p-2.5 rounded-xl bg-violet-50 text-violet-650 dark:bg-violet-950/40 dark:text-violet-400">
              <Bell className="h-5 w-5" />
            </span>
            <div>
              <CardTitle>Notification Hub</CardTitle>
              <CardDescription>Choose how you want to be notified about automation changes</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-zinc-800/80">
              <div className="space-y-0.5">
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Email Alerts</span>
                <p className="text-xs text-zinc-550 dark:text-zinc-450">Get email report digests upon submission completion</p>
              </div>
              <input type="checkbox" defaultChecked className="h-4.5 w-4.5 rounded border-zinc-300 text-violet-600 focus:ring-violet-600 cursor-pointer" />
            </div>
            <div className="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-zinc-800/80">
              <div className="space-y-0.5">
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Failure Warnings</span>
                <p className="text-xs text-zinc-550 dark:text-zinc-450">Notify immediately when outreach submission encounters an error</p>
              </div>
              <input type="checkbox" defaultChecked className="h-4.5 w-4.5 rounded border-zinc-300 text-violet-600 focus:ring-violet-600 cursor-pointer" />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            type="submit"
            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-lg px-6 font-medium cursor-pointer"
          >
            <Save className="mr-2 h-4.5 w-4.5" />
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
