import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/navbar";
import { QueryProvider } from "@/providers/query-provider";
import { DashboardStateProvider } from "@/lib/context/dashboard-state";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Web Automation Dashboard",
  description: "Next-gen web outreach and automated submission tracking platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-screen bg-zinc-50/50 dark:bg-zinc-950/50 font-sans flex text-zinc-900 dark:text-zinc-50">
        <QueryProvider>
          <DashboardStateProvider>
            <div className="flex w-full min-h-screen">
              <Sidebar />
              <div className="flex-1 flex flex-col min-w-0">
                <Navbar />
                <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-zinc-50/30 dark:bg-zinc-950/30">
                  {children}
                </main>
              </div>
            </div>
          </DashboardStateProvider>
        </QueryProvider>
      </body>
    </html>
  );
}

