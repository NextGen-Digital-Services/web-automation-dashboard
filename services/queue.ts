import PQueue from "p-queue";
import { prisma, updateUserAnalytics } from "@/lib/db";
import { runAutomationForSubmission } from "./automation-engine";

// Create a global container for the PQueue to survive Next.js hot reloading
const globalForQueue = globalThis as unknown as {
  automationQueue: PQueue | undefined;
};

// Initialize queue with a concurrency of 2 to balance resource constraints
export const queue =
  globalForQueue.automationQueue ??
  new PQueue({ concurrency: 2 });

if (process.env.NODE_ENV !== "production") {
  globalForQueue.automationQueue = queue;
}

/**
 * Checks if a user has exceeded their daily limit of 5000 URL submissions.
 */
export async function checkUserDailyLimit(userId: string): Promise<boolean> {
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  const submissionCount = await prisma.uRLSubmission.count({
    where: {
      userId,
      createdAt: {
        gte: oneDayAgo,
      },
    },
  });

  return submissionCount >= 5000;
}

/**
 * Adds a job execution task to the background processing queue.
 */
export async function queueJob(jobId: string) {
  const job = await prisma.automationJob.findUnique({
    where: { id: jobId },
    include: { submission: true },
  });

  if (!job) {
    console.error(`Queue error: Job ${jobId} not found`);
    return;
  }

  // Prevent duplicate processing
  if (job.status === "processing" || job.status === "success") {
    console.log(`Job ${jobId} is already ${job.status}. Skipping.`);
    return;
  }

  // Add the execution task to p-queue
  queue.add(async () => {
    try {
      // 1. Update status to processing
      await prisma.automationJob.update({
        where: { id: jobId },
        data: {
          status: "processing",
          attempts: { increment: 1 },
        },
      });

      await prisma.uRLSubmission.update({
        where: { id: job.submissionId },
        data: { status: "pending" },
      });

      // 2. Run Playwright automation logic
      await runAutomationForSubmission(job.submissionId);

      // 3. Update job outcome
      await prisma.automationJob.update({
        where: { id: jobId },
        data: { status: "success" },
      });

      // Update analytics
      await updateUserAnalytics(job.submission.userId);

    } catch (error: any) {
      console.error(`Job ${jobId} execution failed:`, error);

      const updatedJob = await prisma.automationJob.findUnique({
        where: { id: jobId },
      });

      const attempts = updatedJob?.attempts ?? 1;
      const maxAttempts = updatedJob?.maxAttempts ?? 3;

      if (attempts < maxAttempts) {
        // Queue retry
        await prisma.automationJob.update({
          where: { id: jobId },
          data: {
            status: "retrying",
            lastError: error.message,
          },
        });

        // Push back into queue after 5 seconds delay
        setTimeout(() => {
          queueJob(jobId).catch(console.error);
        }, 5000);
      } else {
        // Mark as completely failed
        await prisma.automationJob.update({
          where: { id: jobId },
          data: {
            status: "failed",
            lastError: error.message,
          },
        });

        await prisma.uRLSubmission.update({
          where: { id: job.submissionId },
          data: { status: "failed" },
        });

        // Update analytics
        await updateUserAnalytics(job.submission.userId);
      }
    }
  });
}
