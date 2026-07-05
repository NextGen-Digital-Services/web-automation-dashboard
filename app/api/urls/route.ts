import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma, updateUserAnalytics } from "@/lib/db";
import { z } from "zod";
import { queueJob, checkUserDailyLimit } from "@/services/queue";

const urlSchema = z.object({
  websiteUrl: z.string().url("Must be a valid website URL"),
  businessName: z.string().min(2, "Must be at least 2 characters"),
  priority: z.enum(["low", "medium", "high"]),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const body = await req.json();

    const validation = urlSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { errors: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { websiteUrl, businessName, priority } = validation.data;

    // Check daily limit of 5000 URLs
    const limitExceeded = await checkUserDailyLimit(userId);
    if (limitExceeded) {
      return NextResponse.json(
        { message: "Daily limit of 5000 URL submissions exceeded" },
        { status: 429 }
      );
    }

    // Check for duplicate pending or processing URL submission for this user
    const duplicate = await prisma.uRLSubmission.findFirst({
      where: {
        userId,
        websiteUrl,
        status: { in: ["pending"] },
      },
    });

    if (duplicate) {
      return NextResponse.json(
        { message: "This URL is already being processed" },
        { status: 409 }
      );
    }

    // Create the submission
    const submission = await prisma.uRLSubmission.create({
      data: {
        websiteUrl,
        businessName,
        priority,
        status: "pending",
        userId,
      },
    });

    // Create the automation job
    const job = await prisma.automationJob.create({
      data: {
        submissionId: submission.id,
        status: "pending",
      },
    });

    // Log the initial activity
    await prisma.activityLog.create({
      data: {
        userId,
        action: "URL_REGISTERED",
        details: `Registered outreach target: ${businessName} (${websiteUrl})`,
      },
    });

    // Recalculate user analytics
    await updateUserAnalytics(userId);

    // Queue the job for background execution (non-blocking)
    queueJob(job.id).catch((err) => {
      console.error("Queue job error:", err);
    });

    return NextResponse.json(submission, { status: 201 });
  } catch (error) {
    console.error("Create URL error:", error);
    return NextResponse.json(
      { message: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;

    const submissions = await prisma.uRLSubmission.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(submissions);
  } catch (error) {
    console.error("Get URLs error:", error);
    return NextResponse.json(
      { message: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

