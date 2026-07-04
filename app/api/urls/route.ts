import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

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

    const submission = await prisma.uRLSubmission.create({
      data: {
        websiteUrl,
        businessName,
        priority,
        status: "pending",
        userId,
      },
    });

    // Create a mock associated report for the submission to simulate automation activity
    await prisma.report.create({
      data: {
        urlSubmissionId: submission.id,
        totalAttempts: 1,
        successfulAttempts: 0,
        failedAttempts: 0,
        successRate: 0,
      },
    });

    // Fire simulated status completion in database background
    setTimeout(async () => {
      try {
        const outcome = Math.random() > 0.3 ? "success" : "failed";
        await prisma.uRLSubmission.update({
          where: { id: submission.id },
          data: { status: outcome },
        });

        await prisma.report.create({
          data: {
            urlSubmissionId: submission.id,
            totalAttempts: 2,
            successfulAttempts: outcome === "success" ? 1 : 0,
            failedAttempts: outcome === "failed" ? 1 : 0,
            successRate: outcome === "success" ? 100 : 0,
          },
        });
      } catch (err) {
        console.error("Simulated completion error:", err);
      }
    }, 8000);

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
