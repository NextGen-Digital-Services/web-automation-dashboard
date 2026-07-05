import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma, updateUserAnalytics } from "@/lib/db";
import { queueJob } from "@/services/queue";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;

    const jobs = await prisma.automationJob.findMany({
      where: {
        submission: {
          userId,
        },
      },
      include: {
        submission: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return NextResponse.json(jobs);
  } catch (error) {
    console.error("Get jobs error:", error);
    return NextResponse.json(
      { message: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const body = await req.json();
    const { jobId } = body;

    if (!jobId) {
      return NextResponse.json({ message: "Missing jobId" }, { status: 400 });
    }

    const job = await prisma.automationJob.findUnique({
      where: { id: jobId },
      include: { submission: true },
    });

    if (!job) {
      return NextResponse.json({ message: "Job not found" }, { status: 404 });
    }

    // Verify ownership
    if (job.submission.userId !== userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Reset job and URL submission status to pending
    const updatedJob = await prisma.automationJob.update({
      where: { id: jobId },
      data: {
        status: "pending",
        attempts: 0,
        lastError: null,
      },
    });

    await prisma.uRLSubmission.update({
      where: { id: job.submissionId },
      data: {
        status: "pending",
      },
    });

    // Log retry activity
    await prisma.activityLog.create({
      data: {
        userId,
        action: "JOB_RETRY",
        details: `Manually triggered retry for: ${job.submission.businessName} (${job.submission.websiteUrl})`,
      },
    });

    // Update analytics
    await updateUserAnalytics(userId);

    // Re-queue the job
    queueJob(jobId).catch((err) => {
      console.error("Failed to re-queue job:", err);
    });

    return NextResponse.json(updatedJob);
  } catch (error) {
    console.error("Retry job error:", error);
    return NextResponse.json(
      { message: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
